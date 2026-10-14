import { signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, Observable, Subject, switchMap, tap } from 'rxjs';
import { mensagemApi } from '../../../core/auth/utils/api-error';
/** Instanciar no contexto de injeção do componente. Uma nova consulta cancela a anterior. */
export class ConsultaDashboard<T> {
  readonly dados = signal<T | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  private readonly consultas = new Subject<string | undefined>();
  constructor(consultar: (mes?: string) => Observable<T>, recebido?: (dados: T) => void) {
    this.consultas.pipe(switchMap(mes => {
      this.carregando.set(true);
      this.erro.set(null);
      this.dados.set(null);
      return consultar(mes).pipe(tap(dados => { this.dados.set(dados); recebido?.(dados); }), catchError((error: HttpErrorResponse) => { this.erro.set(mensagemApi(error)); return EMPTY; }), finalize(() => this.carregando.set(false)));
    }), takeUntilDestroyed()).subscribe();
  }
  carregar(mes?: string): void { this.consultas.next(mes); }
}
