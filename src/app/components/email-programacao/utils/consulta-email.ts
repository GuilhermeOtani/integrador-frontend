import { DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable, Subscription } from 'rxjs';
import { mensagemApi } from '../../../core/auth/utils/api-error';

/** GET independente: preserva dados antigos, mas marca erro e cancela respostas fora de ordem. */
export class ConsultaEmail<T> {
  private readonly destroyRef = inject(DestroyRef);
  private consulta?: Subscription;
  readonly dados = signal<T | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly statusErro = signal<number | null>(null);
  carregar(fonte: Observable<T>, recebido?: (dados: T) => void, falhou?: (erro: HttpErrorResponse) => void): void {
    this.consulta?.unsubscribe();
    this.carregando.set(true); this.erro.set(null); this.statusErro.set(null);
    this.consulta = fonte.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: dados => { this.dados.set(dados); recebido?.(dados); },
      error: (erro: HttpErrorResponse) => { this.erro.set(mensagemApi(erro)); this.statusErro.set(erro.status); falhou?.(erro); },
    });
  }
  limpar(): void { this.consulta?.unsubscribe(); this.dados.set(null); this.erro.set(null); this.statusErro.set(null); }
}
