import { CommonModule, registerLocaleData } from '@angular/common';
import ptBR from '@angular/common/locales/pt';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { CobrancaParaPagamento, FormaPagamento, ReciboMatricula } from '../../models/conta-receber';
import { RecebimentoService } from '../../service/recebimento-service';
registerLocaleData(ptBR, 'pt-BR');
@Component({
  selector: 'app-pagamento-matricula', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, InputNumberModule, MessageModule, SelectModule, TagModule],
  templateUrl: './pagamento-matricula.html',
})
export class PagamentoMatricula {
  private readonly recebimentoService = inject(RecebimentoService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly concluido = output<ReciboMatricula>();
  readonly reconsultar = output<void>();
  readonly pagando = signal(false);
  readonly carregandoRecibo = signal(false);
  readonly contaSelecionada = signal<CobrancaParaPagamento | null>(null);
  readonly contaRecibo = signal<CobrancaParaPagamento | null>(null);
  readonly recibo = signal<ReciboMatricula | null>(null);
  readonly erroPagamento = signal<string | null>(null);
  readonly falhaRede = signal(false);
  readonly formaPagamento = new FormControl<FormaPagamento>('PIX', { nonNullable: true, validators: Validators.required });
  readonly formasPagamento = [
    { label: 'PIX', value: 'PIX' }, { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Cartão', value: 'CARTAO' }, { label: 'Boleto', value: 'BOLETO' },
    { label: 'Transferência bancária', value: 'TRANSFERENCIA' },
  ];
  podePagar(conta: CobrancaParaPagamento): boolean {
    return (conta.status === 'PENDENTE' || conta.status === 'ATRASADO') &&
      conta.valor !== null && Number.isFinite(conta.valor) && conta.valor >= 0 && !!conta.dataVencimento;
  }
  atualizarAposFalha(): void { this.fecharPagamento(); this.reconsultar.emit(); }
  abrirPagamento(conta: CobrancaParaPagamento): void {
    if (!this.podePagar(conta) || this.pagando() || this.carregandoRecibo())
      return;
    this.formaPagamento.setValue('PIX');
    this.erroPagamento.set(null);
    this.falhaRede.set(false);
    this.contaSelecionada.set({ ...conta });
  }
  fecharPagamento(): void {
    if (this.pagando())
      return;
    this.contaSelecionada.set(null);
    this.erroPagamento.set(null);
  }
  confirmarPagamento(): void {
    const conta = this.contaSelecionada();
    if (!conta || !this.podePagar(conta) || this.pagando() || this.formaPagamento.invalid || this.falhaRede())
      return;
    this.pagando.set(true);
    this.erroPagamento.set(null);
    this.formaPagamento.disable({ emitEvent: false });
    this.recebimentoService
      .pagar(conta.id, this.formaPagamento.value)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.pagando.set(false);
      this.formaPagamento.enable({ emitEvent: false });
    }))
      .subscribe({
      next: (recibo) => {
        this.contaRecibo.set({ ...conta });
        this.contaSelecionada.set(null);
        this.recibo.set(recibo);
        this.messages.add({
          severity: 'success',
          summary: 'Pagamento realizado',
          detail: 'A cobrança foi paga e o recibo já está disponível.',
          life: 4000,
        });
        this.concluido.emit(recibo);
      },
      error: (error: HttpErrorResponse) => this.tratarErroPagamento(error),
    });
  }
  visualizarRecibo(conta: CobrancaParaPagamento): void {
    if (conta.status !== 'PAGO' || this.carregandoRecibo() || this.pagando())
      return;
    this.recibo.set(null);
    this.contaRecibo.set({ ...conta });
    this.carregandoRecibo.set(true);
    this.recebimentoService
      .buscarRecibo(conta.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoRecibo.set(false)))
      .subscribe({
      next: (recibo) => this.recibo.set(recibo),
      error: (error: HttpErrorResponse) => {
        this.contaRecibo.set(null);
        if (![0, 401, 403].includes(error.status)) {
          this.messages.add({
            severity: 'error',
            summary: 'Recibo indisponível',
            detail: mensagemApi(error),
            life: 5000,
          });
        }
        if (error.status === 404)
          this.reconsultar.emit();
      },
    });
  }
  fecharRecibo(): void {
    this.recibo.set(null);
    this.contaRecibo.set(null);
  }
  private tratarErroPagamento(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.contaSelecionada.set(null);
      this.erroPagamento.set(null);
      this.messages.add({
        severity: 'warn',
        summary: 'Cobrança já paga',
        detail: mensagemApi(error),
        life: 5000,
      });
      this.reconsultar.emit();
      return;
    }
    if (error.status === 404) {
      this.contaSelecionada.set(null);
      this.erroPagamento.set(null);
      this.messages.add({
        severity: 'error',
        summary: 'Cobrança não encontrada',
        detail: mensagemApi(error),
        life: 5000,
      });
      this.reconsultar.emit();
      return;
    }
    if (error.status === 400) {
      this.erroPagamento.set(mensagemApi(error));
      return;
    }
    if (error.status === 0) {
      this.falhaRede.set(true);
      this.erroPagamento.set('Não foi possível confirmar a resposta. Atualize as cobranças antes de tentar novamente; o pagamento pode ter sido registrado.');
      return;
    }
    if (![401, 403].includes(error.status)) {
      this.erroPagamento.set(mensagemApi(error));
    }
  }
}
