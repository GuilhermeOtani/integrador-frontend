import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { AcaoTabela } from '../../../../shared/ui/tabelas/acao-tabela';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { avisoFinanceiro, diaFinanceiro, moedaFinanceira, pesquisaFinanceira } from '../../../../core/financeiro/financeiro.utils';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber, StatusFinanceiro } from '../../models/conta-receber';
import { PagamentoMatricula } from '../pagamento-matricula/pagamento-matricula';
@Component({
  selector: 'app-minhas-matriculas',
  standalone: true,
  imports: [TabelaPadrao, AcaoTabela,
    CommonModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,

    PagamentoMatricula,
  ],
  templateUrl: './minhas-matriculas.html',
  styleUrls: ['../../../relatorios/styles/financeiro.css', './minhas-matriculas.css'],
})
export class MinhasMatriculas implements OnInit {
  private readonly contaReceberService = inject(ContaReceberService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pagamento = viewChild.required(PagamentoMatricula);
  readonly moeda = moedaFinanceira; readonly dia = diaFinanceiro; readonly avisoConta = avisoFinanceiro;
  readonly pagamentoRegistrado = signal(false);
  readonly contas = signal<ContaReceber[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly mostrarPagas = signal(false);
  readonly pesquisa = signal('');
  readonly primeiraLinha = signal(0);
  readonly contasEmAberto = computed(() => this.contas().filter((c) => c.status !== 'PAGO'));
  readonly contasPagas = computed(() => this.contas().filter((c) => c.status === 'PAGO'));
  readonly contasVisiveis = computed(() => {
    const termo = pesquisaFinanceira(this.pesquisa());
    return (this.mostrarPagas() ? this.contasPagas() : this.contasEmAberto()).filter(conta =>
      !termo || pesquisaFinanceira(`${conta.id} ${conta.descricao ?? ''} ${conta.nomeAluno ?? ''} ${conta.competencia ?? ''} ${conta.status}`).includes(termo));
  });
  ngOnInit(): void {
    this.carregar();
  }
  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.contaReceberService
      .listarMinhas()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (contas) => { this.contas.set(contas); this.pagamentoRegistrado.set(false); },
        error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
      });
  }
  abrirPagamento(conta: ContaReceber): void {
    this.pagamento().abrirPagamento(conta);
  }
  aposPagamento(): void { this.pagamentoRegistrado.set(true); this.carregar(); }
  visualizarRecibo(conta: ContaReceber): void {
    this.pagamento().visualizarRecibo(conta);
  }
  selecionarHistorico(mostrar: boolean): void {
    this.mostrarPagas.set(mostrar);
    this.primeiraLinha.set(0);
  }
  pesquisar(texto: string): void { this.pesquisa.set(texto); this.primeiraLinha.set(0); }
  getSeverity(status: StatusFinanceiro | null): 'success' | 'warn' | 'danger' {
    return status === 'PAGO' ? 'success' : status === 'ATRASADO' ? 'danger' : 'warn';
  }
  rotuloStatus(status: StatusFinanceiro | null): string {
    return status === 'PAGO' ? 'Pago' : status === 'ATRASADO' ? 'Atrasado' : status === 'PENDENTE' ? 'Pendente' : 'Não informado';
  }
}
