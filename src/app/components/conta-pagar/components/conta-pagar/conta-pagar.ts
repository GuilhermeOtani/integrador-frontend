import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { AcaoTabela } from '../../../../shared/ui/tabelas/acao-tabela';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { avisoFinanceiro, diaFinanceiro, FORMAS_PAGAMENTO, idFinanceiroValido, moedaFinanceira, pesquisaFinanceira, textoFinanceiro, valorFinanceiroValido } from '../../../../core/financeiro/financeiro.utils';
import { ContaPagarResponse, FormaPagamento, ReciboPagamento } from '../../../relatorios/models/relatorios.models';
import { ContaPagarService } from '../../service/conta-pagar-service';
import { PagamentoService } from '../../service/pagamento-service';
import { IntencaoPagamento, PagamentoPendente } from '../../utils/pagamento-pendente';
import { ContaEditor } from '../conta-editor/conta-editor';
@Component({
  selector: 'app-conta-pagar', standalone: true,
  imports: [TabelaPadrao, AcaoTabela, ReactiveFormsModule, ButtonModule, TableModule, TagModule, DialogModule, SelectModule, InputNumberModule, InputTextModule, MessageModule, CheckboxModule, ContaEditor],
  templateUrl: './conta-pagar.html', styleUrls: ['../../../relatorios/styles/financeiro.css', './conta-pagar.css'],
})
export class ContaPagarComponent implements OnInit {
  private readonly api = inject(ContaPagarService); private readonly pagamentos = inject(PagamentoService);
  private readonly auth = inject(AuthService); private readonly destroyRef = inject(DestroyRef);
  private readonly eventos = inject(FinanceiroEventos);
  private readonly adminId = this.auth.usuario()?.id ?? 0;
  private readonly armazenamento = new PagamentoPendente(this.adminId);
  private listaSub?: Subscription;
  readonly contas = signal<ContaPagarResponse[]>([]); readonly historico = signal(false); readonly pesquisa = signal('');
  readonly primeiraLinha = signal(0);
  readonly carregando = signal(false); readonly operando = signal(false); readonly pagando = signal(false); readonly atualizando = signal(false);
  readonly erro = signal(''); readonly aviso = signal(''); readonly erroPagamento = signal(''); readonly erroRecibos = signal('');
  readonly selecionada = signal<ContaPagarResponse | null>(null);
  readonly recibos = signal<ReciboPagamento[]>([]); readonly recibo = signal<ReciboPagamento | null>(null);
  readonly pendente = signal<IntencaoPagamento | null>(null);
  readonly problemaStorage = signal(false); readonly conferida = signal(false);
  readonly protegidas = signal<Set<number>>(new Set());
  readonly prontoExcluir = signal<ContaPagarResponse | null>(null);
  readonly editorId = signal<number | null | undefined>(undefined);
  readonly busy = computed(() => this.operando() || this.pagando() || this.atualizando());
  readonly visiveis = computed(() => {
    const termo = pesquisaFinanceira(this.pesquisa());
    return this.contas().filter(c => (this.historico() ? c.saldoRestante <= 0 : c.saldoRestante > 0 || c.avisos.includes('VALOR_INVALIDO') || c.avisos.includes('PAGAMENTO_NEGATIVO_LEGADO')) &&
      (!termo || pesquisaFinanceira(`${c.id} ${c.descricao ?? ''} ${c.motorista?.nome ?? ''} ${c.competencia ?? ''}`).includes(termo)));
  });
  readonly formas = [...FORMAS_PAGAMENTO];
  readonly pagamentoForm = new FormGroup({ valor: new FormControl<number | null>(null), forma: new FormControl<FormaPagamento>('PIX', { nonNullable: true }) });
  readonly conferencia = new FormControl(false, { nonNullable: true });
  exibirModalPagamento = false; exibirModalRecibos = false; exibirModalRecibo = false; exibirConferenciaStorage = false;
  readonly moeda = moedaFinanceira; readonly dia = diaFinanceiro; readonly texto = textoFinanceiro; readonly avisoConta = avisoFinanceiro;
  selecionarHistorico(mostrar: boolean): void { this.historico.set(mostrar); this.primeiraLinha.set(0); }
  pesquisar(texto: string): void { this.pesquisa.set(texto); this.primeiraLinha.set(0); }
  rotuloStatus(status: string | null): string { return status === 'PAGO' ? 'Pago' : status === 'ATRASADO' ? 'Atrasado' : status === 'PENDENTE' ? 'Pendente' : 'Não informado'; }
  ngOnInit(): void {
    const leitura = this.armazenamento.ler();
    if (leitura.tipo === 'valida') { this.pendente.set(leitura.intencao); this.aviso.set('Há uma intenção de pagamento pendente nesta sessão. Confira antes de iniciar outra.'); }
    else if (leitura.tipo !== 'ausente') { this.problemaStorage.set(true); this.aviso.set('Não foi possível recuperar com segurança a intenção anterior. Confira os comprovantes antes de liberar novos pagamentos.'); }
    this.carregarContas();
  }
  private mesmoAdmin(): boolean { return this.auth.temPapel('ADMIN') && this.auth.usuario()?.id === this.adminId && idFinanceiroValido(this.adminId); }
  carregarContas(preservarErro = false): void {
    this.listaSub?.unsubscribe();
    this.carregando.set(true); if (!preservarErro) this.erro.set('');
    this.listaSub = this.api.listarTodas().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: contas => this.contas.set(contas), error: (e: HttpErrorResponse) => { this.contas.set([]); this.erro.set(mensagemApi(e)); },
    });
  }
  podePagar(c: ContaPagarResponse): boolean {
    return idFinanceiroValido(c.id) && valorFinanceiroValido(c.valor, true) && c.saldoRestante > 0 &&
      !c.avisos.some(a => ['VALOR_INVALIDO', 'PAGAMENTO_NEGATIVO_LEGADO', 'PAGAMENTO_SUPERIOR_A_CONTA', 'QUITACAO_SEM_COMPROVANTE'].includes(a));
  }
  protegido(c: ContaPagarResponse): boolean { return c.status === 'PAGO' || c.valorPago !== 0 || this.protegidas().has(c.id) || c.avisos.some(a => ['QUITACAO_SEM_COMPROVANTE', 'PAGAMENTO_NEGATIVO_LEGADO', 'PAGAMENTO_SUPERIOR_A_CONTA'].includes(a)); }
  private registrarProtecao(c: ContaPagarResponse, recibos: ReciboPagamento[]): void {
    if (recibos.length || c.status === 'PAGO') this.protegidas.update(ids => new Set([...ids, c.id]));
  }
  abrirModalPagamento(c: ContaPagarResponse): void {
    if (this.busy() || this.pendente() || this.problemaStorage() || !this.mesmoAdmin() || !this.podePagar(c)) return;
    this.operando.set(true); this.erroPagamento.set(''); this.aviso.set('');
    this.api.buscar(c.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
      next: atual => {
        this.selecionada.set(atual);
        if (!this.podePagar(atual)) { this.erro.set('A conta não está disponível para pagamento. Atualize a lista e confira os avisos.'); this.carregarContas(true); return; }
        this.pagamentoForm.enable(); this.pagamentoForm.reset({ valor: atual.saldoRestante, forma: 'PIX' }); this.exibirModalPagamento = true;
      }, error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
    });
  }
  validacaoPagamento(): string {
    const v = this.pagamentoForm.getRawValue();
    if (!valorFinanceiroValido(v.valor, true)) return 'Informe um pagamento positivo com até duas casas decimais.';
    if (v.valor > (this.selecionada()?.saldoRestante ?? 0)) return 'O pagamento não pode ultrapassar o saldo restante.';
    if (!FORMAS_PAGAMENTO.some(f => f.value === v.forma)) return 'Selecione a forma de pagamento.';
    return '';
  }
  confirmarPagamento(): void {
    if (this.busy() || this.pendente() || this.problemaStorage() || !this.mesmoAdmin() || !this.selecionada()) return;
    const erro = this.validacaoPagamento(); this.erroPagamento.set(erro); if (erro) return;
    const c = this.selecionada()!; const v = this.pagamentoForm.getRawValue();
    this.operando.set(true); this.pagamentoForm.disable({ emitEvent: false });
    this.api.buscar(c.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.operando.set(false); if (!this.pendente()) this.pagamentoForm.enable({ emitEvent: false });
    })).subscribe({
      next: atual => {
        this.selecionada.set(atual);
        if (!this.podePagar(atual) || v.valor! > atual.saldoRestante) { this.erroPagamento.set('O saldo foi alterado. Confira a posição atual antes de confirmar novamente.'); return; }
        let chave: string;
        try { chave = crypto.randomUUID(); } catch { this.erroPagamento.set('Não foi possível gerar uma chave segura. Nenhum pagamento foi solicitado.'); return; }
        const i: IntencaoPagamento = { versao: 1, adminId: this.adminId, contaId: atual.id, formaPagamento: v.forma, valorPago: v.valor!, chave, estado: 'INCERTA' };
        if (!this.armazenamento.salvar(i)) { this.erroPagamento.set('Não foi possível guardar a chave de recuperação. Nenhum pagamento foi solicitado. Verifique o armazenamento da sessão.'); return; }
        this.pendente.set(i); this.enviar(i);
      }, error: (e: HttpErrorResponse) => this.erroPagamento.set(mensagemApi(e)),
    });
  }
  private enviar(i: IntencaoPagamento): void {
    if (this.pagando() || !this.mesmoAdmin()) return;
    this.pagando.set(true); this.erroPagamento.set(''); this.conferida.set(false); this.conferencia.setValue(false);
    this.pagamentos.realizarPagamento(i.contaId, i.formaPagamento, i.valorPago, i.chave)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.pagando.set(false))).subscribe({
        next: resposta => {
          if (!resposta || !idFinanceiroValido(resposta.id)) { this.erroPagamento.set('Resposta de pagamento inesperada. A operação pode ter sido registrada; confira ou repita com a mesma chave.'); return; }
          const registrada: IntencaoPagamento = { ...i, estado: 'REGISTRADA' }; this.pendente.set(registrada); this.armazenamento.salvar(registrada);
          this.aviso.set('Pagamento registrado. Atualizando contas e comprovantes.'); this.eventos.invalidar(); this.atualizarConfirmado();
        },
        error: (e: HttpErrorResponse) => {
          if (e.status === 400 || e.status === 404) {
            if (this.armazenamento.salvar(null)) { this.pendente.set(null); this.pagamentoForm.enable({ emitEvent: false }); }
          }
          const incerto = e.status === 0 || e.status >= 500 || e.status === 408 || e.status === 409;
          this.erroPagamento.set(`${mensagemApi(e)}${incerto ? ' Não crie outra intenção sem conferir. A repetição manterá a mesma chave e os mesmos parâmetros.' : ''}`);
        },
      });
  }
  repetirPagamento(): void {
    const i = this.pendente();
    if (!i || i.estado !== 'INCERTA' || this.busy()) return;
    this.exibirModalPagamento = true; this.enviar(i);
  }
  retomar(): void {
    const i = this.pendente(); if (!i || this.busy()) return;
    this.pagamentoForm.reset({ valor: i.valorPago ?? null, forma: i.formaPagamento }); this.pagamentoForm.disable(); this.exibirModalPagamento = true;
    if (i.estado === 'REGISTRADA') this.atualizarConfirmado(); else this.conferir();
  }
  conferir(): void {
    const i = this.pendente(); if (!i || i.estado !== 'INCERTA' || this.busy()) return;
    this.operando.set(true); this.conferida.set(false); this.conferencia.setValue(false); this.erroPagamento.set('');
    forkJoin({ conta: this.api.buscar(i.contaId), recibos: this.pagamentos.listarPorConta(i.contaId) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
        next: r => { this.selecionada.set(r.conta); this.recibos.set(r.recibos); this.registrarProtecao(r.conta, r.recibos); this.conferida.set(true); },
        error: (e: HttpErrorResponse) => this.erroPagamento.set(mensagemApi(e)),
      });
  }
  encerrarPendencia(): void {
    if (this.busy() || !this.conferida() || !this.conferencia.value || this.pendente()?.estado !== 'INCERTA' || !this.mesmoAdmin()) return;
    if (!this.armazenamento.salvar(null)) { this.erroPagamento.set('Não foi possível remover a pendência da sessão.'); return; }
    this.pendente.set(null); this.exibirModalPagamento = false; this.selecionada.set(null); this.recibos.set([]);
    this.aviso.set('Pendência local encerrada após conferência. Isso não desfaz pagamentos no servidor.'); this.carregarContas(); this.eventos.invalidar();
  }
  atualizarConfirmado(): void {
    const i = this.pendente(); if (!i || i.estado !== 'REGISTRADA' || this.atualizando() || !this.mesmoAdmin()) return;
    this.listaSub?.unsubscribe();
    this.atualizando.set(true); this.erroPagamento.set('');
    forkJoin({ contas: this.api.listarTodas(), conta: this.api.buscar(i.contaId), recibos: this.pagamentos.listarPorConta(i.contaId) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.atualizando.set(false))).subscribe({
        next: r => {
          this.contas.set(r.contas); this.selecionada.set(r.conta); this.recibos.set(r.recibos); this.registrarProtecao(r.conta, r.recibos);
          if (!this.armazenamento.salvar(null)) { this.erroPagamento.set('Pagamento registrado; não foi possível limpar a pendência da sessão. Tente atualizar os dados novamente.'); return; }
          this.pendente.set(null); this.exibirModalPagamento = false; this.exibirModalRecibos = true; this.aviso.set('Pagamento registrado e posição financeira atualizada.');
        }, error: () => this.erroPagamento.set('Pagamento registrado; não foi possível atualizar contas e comprovantes. Atualize os dados, sem reenviar o pagamento.'),
      });
  }
  liberarStorage(): void {
    if (this.busy() || !this.problemaStorage() || !this.conferencia.value || !this.mesmoAdmin()) return;
    if (!this.armazenamento.salvar(null)) { this.erro.set('O armazenamento da sessão continua indisponível. Novos pagamentos permanecem bloqueados.'); return; }
    this.problemaStorage.set(false); this.exibirConferenciaStorage = false; this.aviso.set('Recuperação local encerrada após conferência manual. Nenhum pagamento foi solicitado.');
  }
  abrirModalRecibo(c: ContaPagarResponse): void {
    if (this.busy()) return;
    this.operando.set(true); this.erroRecibos.set(''); this.recibos.set([]); this.recibo.set(null); this.selecionada.set(c); this.exibirModalRecibos = true;
    this.pagamentos.listarPorConta(c.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
      next: r => { this.recibos.set(r); this.registrarProtecao(c, r); }, error: (e: HttpErrorResponse) => this.erroRecibos.set(mensagemApi(e)),
    });
  }
  verRecibo(r: ReciboPagamento): void { this.recibo.set(r); this.exibirModalRecibo = true; }
  abrirEditor(id: number | null): void { if (!this.busy() && this.mesmoAdmin() && (id === null || this.pendente()?.contaId !== id)) this.editorId.set(id); }
  contaSalva(): void { this.editorId.set(undefined); this.aviso.set('Conta salva.'); this.carregarContas(); }
  solicitarExclusao(c: ContaPagarResponse): void {
    if (this.busy() || this.protegido(c) || !this.mesmoAdmin() || this.pendente()?.contaId === c.id) return;
    this.operando.set(true); this.erro.set('');
    forkJoin({ conta: this.api.buscar(c.id), recibos: this.pagamentos.listarPorConta(c.id) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
        next: r => {
          this.registrarProtecao(r.conta, r.recibos);
          if (r.recibos.length || this.protegido(r.conta)) { this.erro.set('A conta possui comprovantes ou quitação histórica e não pode ser excluída.'); this.carregarContas(true); }
          else this.prontoExcluir.set(r.conta);
        }, error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
      });
  }
  excluir(): void {
    const c = this.prontoExcluir(); if (!c || this.busy() || !this.mesmoAdmin()) return;
    this.operando.set(true); this.erro.set('');
    this.api.excluir(c.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.operando.set(false))).subscribe({
      next: () => { this.prontoExcluir.set(null); this.aviso.set('Conta excluída.'); this.eventos.invalidar(); this.carregarContas(); },
      error: (e: HttpErrorResponse) => { this.erro.set(mensagemApi(e)); this.prontoExcluir.set(null); this.carregarContas(true); },
    });
  }
}
