import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { finalize } from 'rxjs';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { ContaReceberService } from '../../service/conta-receber-service';
import {
  ContaReceber,
  FormaPagamento,
  ReciboMatricula,
  StatusFinanceiro,
} from '../../models/conta-receber';
import { RecebimentoService } from '../../service/recebimento-service';

interface OpcaoPagamento {
  label: string;
  value: FormaPagamento;
}

@Component({
  selector: 'app-minhas-matriculas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule,
    ToolbarModule,
  ],
  templateUrl: './minhas-matriculas.html',
  styleUrl: './minhas-matriculas.css',
})
export class MinhasMatriculas implements OnInit {
  private readonly contaReceberService = inject(ContaReceberService);
  private readonly recebimentoService = inject(RecebimentoService);
  private readonly messages = inject(MessageService);

  readonly contas = signal<ContaReceber[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly mostrarPagas = signal(false);
  readonly pagando = signal(false);
  readonly carregandoRecibo = signal(false);
  readonly contaSelecionada = signal<ContaReceber | null>(null);
  readonly contaRecibo = signal<ContaReceber | null>(null);
  readonly recibo = signal<ReciboMatricula | null>(null);
  readonly erroPagamento = signal<string | null>(null);

  readonly contasEmAberto = computed(() =>
    this.contas().filter((conta) => conta.status !== 'PAGO'),
  );
  readonly contasPagas = computed(() =>
    this.contas().filter((conta) => conta.status === 'PAGO'),
  );
  readonly contasVisiveis = computed(() =>
    this.mostrarPagas() ? this.contasPagas() : this.contasEmAberto(),
  );

  readonly formasPagamento: OpcaoPagamento[] = [
    { label: 'PIX', value: 'PIX' },
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Cartão', value: 'CARTAO' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Transferência bancária', value: 'TRANSFERENCIA' },
  ];
  formaPagamento: FormaPagamento = 'PIX';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.contaReceberService
      .listarMinhas()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (contas) => this.contas.set(contas),
        error: (error: HttpErrorResponse) => this.erro.set(mensagemApi(error)),
      });
  }

  abrirPagamento(conta: ContaReceber): void {
    if (conta.status === 'PAGO' || this.pagando()) return;
    this.formaPagamento = 'PIX';
    this.erroPagamento.set(null);
    this.contaSelecionada.set(conta);
  }

  fecharPagamento(): void {
    if (this.pagando()) return;
    this.contaSelecionada.set(null);
    this.erroPagamento.set(null);
  }

  confirmarPagamento(): void {
    const conta = this.contaSelecionada();
    if (!conta || conta.status === 'PAGO' || this.pagando()) return;

    this.pagando.set(true);
    this.erroPagamento.set(null);
    this.recebimentoService
      .pagar(conta.id, this.formaPagamento)
      .pipe(finalize(() => this.pagando.set(false)))
      .subscribe({
        next: (recibo) => {
          this.contaRecibo.set(conta);
          this.contaSelecionada.set(null);
          this.recibo.set(recibo);
          this.messages.add({
            severity: 'success',
            summary: 'Pagamento realizado',
            detail: 'A cobrança foi paga e o recibo já está disponível.',
            life: 4000,
          });
          this.carregar();
        },
        error: (error: HttpErrorResponse) => this.tratarErroPagamento(error),
      });
  }

  visualizarRecibo(conta: ContaReceber): void {
    if (conta.status !== 'PAGO' || this.carregandoRecibo()) return;

    this.contaRecibo.set(conta);
    this.carregandoRecibo.set(true);
    this.recebimentoService
      .buscarRecibo(conta.id)
      .pipe(finalize(() => this.carregandoRecibo.set(false)))
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
          if (error.status === 404) this.carregar();
        },
      });
  }

  fecharRecibo(): void {
    this.recibo.set(null);
    this.contaRecibo.set(null);
  }

  selecionarHistorico(mostrar: boolean): void {
    this.mostrarPagas.set(mostrar);
  }

  getSeverity(status: StatusFinanceiro): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'ATRASADO') return 'danger';
    return 'warn';
  }

  rotuloStatus(status: StatusFinanceiro): string {
    if (status === 'PAGO') return 'Pago';
    if (status === 'ATRASADO') return 'Atrasado';
    return 'Pendente';
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
      this.carregar();
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
      this.carregar();
      return;
    }

    if (error.status === 400) {
      this.erroPagamento.set(mensagemApi(error));
      return;
    }

    if (![0, 401, 403].includes(error.status)) {
      this.erroPagamento.set(mensagemApi(error));
    }
  }
}
