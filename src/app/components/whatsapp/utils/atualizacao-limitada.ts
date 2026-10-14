import { Observable, Subscription, exhaustMap, takeUntil, timer } from 'rxjs';

/** Apenas GETs: nunca repete operações de ativação, configuração ou envio. */
export class AtualizacaoLimitada {
  private assinatura?: Subscription;
  parar(): void { this.assinatura?.unsubscribe(); this.assinatura = undefined; }
  iniciar<T>(consulta: () => Observable<T>, receber: (dados: T) => void, falhar: (erro: unknown) => void, continuar: (dados: T) => boolean, expiraEm?: string | null): void {
    this.parar();
    const limite = Math.min(600_000, expiraEm ? new Date(expiraEm).getTime() - Date.now() : 600_000);
    if (!Number.isFinite(limite) || limite <= 0) return;
    this.assinatura = timer(5000, 5000).pipe(exhaustMap(consulta), takeUntil(timer(limite))).subscribe({
      next: dados => { receber(dados); if (!continuar(dados)) this.parar(); },
      error: erro => { this.parar(); falhar(erro); },
    });
  }
}
