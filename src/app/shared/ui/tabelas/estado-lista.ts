import { DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, finalize, Observable, tap } from 'rxjs';
import { mensagemApi } from '../../../core/auth/utils/api-error';

/** Estado visual por instância. Não guarda dados, repete chamadas ou altera a ordem das respostas. */
export class EstadoLista {
  private readonly destroyRef = inject(DestroyRef);
  private emAndamento = 0;
  readonly carregando = signal(false); readonly erro = signal('');
  acompanhar<T>(consulta: Observable<T>): Observable<T> {
    return defer(() => {
      this.emAndamento++; this.carregando.set(true); this.erro.set('');
      return consulta.pipe(
        tap({ error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)) }),
        finalize(() => { this.emAndamento--; this.carregando.set(this.emAndamento > 0); }),
        takeUntilDestroyed(this.destroyRef),
      );
    });
  }
}
