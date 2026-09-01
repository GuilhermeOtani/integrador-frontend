import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { mensagemApi } from './api-error';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const messages = inject(MessageService);
  const chamadaDoBackend =
    request.url === environment.apiUrl || request.url.startsWith(`${environment.apiUrl}/`);
  const chamadaDeLogin = request.url === `${environment.apiUrl}/auth/login`;
  const token = chamadaDoBackend && !chamadaDeLogin ? auth.token() : null;
  const autenticada = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(autenticada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!chamadaDoBackend) return throwError(() => error);

      if (error.status === 401 && !chamadaDeLogin) {
        auth.logout();
      } else if (error.status === 403) {
        void router.navigateByUrl('/sem-permissao');
      } else if (error.status === 0 && !chamadaDeLogin) {
        messages.add({ severity: 'error', summary: 'Backend indisponível', detail: mensagemApi(error) });
      }
      return throwError(() => error);
    }),
  );
};
