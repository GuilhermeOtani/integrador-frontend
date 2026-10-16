import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { AcaoTabela } from '../../../../shared/ui/tabelas/acao-tabela';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { avisoFinanceiro, diaFinanceiro, moedaFinanceira, pesquisaFinanceira } from '../../../../core/financeiro/financeiro.utils';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { CobrancaEditor } from '../cobranca-editor/cobranca-editor';
import { cobrancaProtegida } from '../../utils/conta-receber.utils';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber, StatusFinanceiro } from '../../models/conta-receber';

@Component({
  selector: 'app-contas-receber',
  standalone: true,
  imports: [TabelaPadrao, AcaoTabela,
    CommonModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    DialogModule, CobrancaEditor,
  ],
  templateUrl: './contas-receber.html',
  styleUrls: ['../../../relatorios/styles/financeiro.css', './contas-receber.css'],
})
export class ContasReceber implements OnInit {
  private readonly contaReceberService = inject(ContaReceberService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventos = inject(FinanceiroEventos);
  readonly editor = signal<{id: number | null} | null>(null);
  readonly exclusao = signal<ContaReceber | null>(null);
  readonly operando = signal(false); readonly avisoOperacao = signal('');
  readonly moeda = moedaFinanceira; readonly dia = diaFinanceiro; readonly avisoConta = avisoFinanceiro;

  readonly contas = signal<ContaReceber[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly mostrarPagas = signal(false);
  readonly pesquisa = signal('');
  readonly primeiraLinha = signal(0);

  readonly contasEmAberto = computed(() =>
    this.contas().filter((conta) => conta.status !== 'PAGO'),
  );
  readonly contasPagas = computed(() =>
    this.contas().filter((conta) => conta.status === 'PAGO'),
  );
  readonly contasVisiveis = computed(() => {
    const termo = pesquisaFinanceira(this.pesquisa());
    return (this.mostrarPagas() ? this.contasPagas() : this.contasEmAberto()).filter(conta =>
      !termo || pesquisaFinanceira(`${conta.id} ${conta.descricao ?? ''} ${conta.nomeAluno ?? ''} ${conta.competencia ?? ''} ${conta.status}`).includes(termo));
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    if (this.carregando() && this.contas().length) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.contaReceberService
      .listarTodas()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (contas) => this.contas.set(contas),
        error: (error: HttpErrorResponse) => this.erro.set(mensagemApi(error)),
      });
  }

  selecionarHistorico(mostrar: boolean): void {
    this.mostrarPagas.set(mostrar);
    this.primeiraLinha.set(0);
  }
  pesquisar(texto: string): void { this.pesquisa.set(texto); this.primeiraLinha.set(0); }

  abrirEditor(id: number | null): void { if (!this.operando()) this.editor.set({ id }); }
  aposSalvar(): void { this.editor.set(null); this.carregar(); }
  prepararExclusao(conta: ContaReceber): void {
    if (this.operando()) return;
    this.operando.set(true); this.avisoOperacao.set('');
    this.contaReceberService.buscar(conta.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
      next: atual => {
        if (cobrancaProtegida(atual)) this.avisoOperacao.set('Exclusão bloqueada: a cobrança possui recebimentos, quitação histórica ou posição incompleta. Preserve o histórico.');
        else this.exclusao.set(atual);
      }, error: (e: HttpErrorResponse) => this.avisoOperacao.set(mensagemApi(e)),
    });
  }
  confirmarExclusao(): void {
    const conta = this.exclusao(); if (!conta || this.operando()) return;
    this.operando.set(true); this.avisoOperacao.set('');
    this.contaReceberService.excluir(conta.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
      next: () => { this.exclusao.set(null); this.eventos.invalidar(); this.carregar(); },
      error: (e: HttpErrorResponse) => { this.avisoOperacao.set(mensagemApi(e)); this.exclusao.set(null); this.carregar(); },
    });
  }
  getSeverity(status: StatusFinanceiro | null): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'ATRASADO') return 'danger';
    return 'warn';
  }

  rotuloStatus(status: StatusFinanceiro | null): string {
    if (status === 'PAGO') return 'Pago';
    if (status === 'ATRASADO') return 'Atrasado';
    return status === 'PENDENTE' ? 'Pendente' : 'Não informado';
  }
}
