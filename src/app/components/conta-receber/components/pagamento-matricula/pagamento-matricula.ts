import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { AcaoTabela } from '../../../../shared/ui/tabelas/acao-tabela';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { finalize, forkJoin } from 'rxjs';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { avisoFinanceiro, FORMAS_PAGAMENTO, moedaFinanceira, valorFinanceiroValido } from '../../../../core/financeiro/financeiro.utils';
import { CobrancaParaPagamento, FormaPagamento, ReciboMatricula } from '../../models/conta-receber';
import { RecebimentoService } from '../../service/recebimento-service';
import { ContaReceberService } from '../../service/conta-receber-service';
import { posicaoReceberValida, recebimentoPermitido } from '../../utils/conta-receber.utils';
import { IntencaoRecebimento, RecebimentoPendente } from '../../utils/recebimento-pendente';
@Component({
  selector: 'app-pagamento-matricula', standalone: true,
  imports: [TabelaPadrao, AcaoTabela, CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, InputNumberModule, MessageModule, SelectModule, TagModule, TableModule, ],
  templateUrl: './pagamento-matricula.html', styleUrl: '../../../relatorios/styles/financeiro.css',
})
export class PagamentoMatricula implements OnInit {
  private readonly recebimentoService = inject(RecebimentoService);
  private readonly contas = inject(ContaReceberService);
  private readonly auth = inject(AuthService);
  private readonly eventos = inject(FinanceiroEventos);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly concluido = output<ReciboMatricula>(); readonly reconsultar = output<void>();
  readonly pagando = signal(false); readonly consultando = signal(false); readonly carregandoRecibo = signal(false);
  readonly contaSelecionada = signal<CobrancaParaPagamento | null>(null);
  readonly contaRecibo = signal<CobrancaParaPagamento | null>(null);
  readonly recibo = signal<ReciboMatricula | null>(null); readonly recibos = signal<ReciboMatricula[]>([]);
  readonly historicoVisivel = signal(false); readonly erroHistorico = signal('');
  readonly erroPagamento = signal<string | null>(null); readonly falhaRede = signal(false);
  readonly pendente = signal<IntencaoRecebimento | null>(null); readonly armazenamentoBloqueado = signal(false); readonly conferido = signal(false);
  readonly formaPagamento = new FormControl<FormaPagamento>('PIX', { nonNullable: true, validators: Validators.required });
  readonly valorPago = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] });
  readonly formasPagamento = [...FORMAS_PAGAMENTO]; readonly moeda = moedaFinanceira; readonly aviso = avisoFinanceiro;
  private usuarioId: number | null = null; private persistencia: RecebimentoPendente | null = null;
  ngOnInit(): void {
    const usuario = this.auth.usuario(); if (usuario?.tipoPessoa !== 'ALUNO') return;
    this.usuarioId = usuario.id; this.persistencia = new RecebimentoPendente(usuario.id);
    const leitura = this.persistencia.ler();
    if (leitura.tipo === 'valida') { this.pendente.set(leitura.intencao); this.falhaRede.set(leitura.intencao.estado === 'INCERTA'); }
    else if (leitura.tipo !== 'ausente') this.armazenamentoBloqueado.set(true);
  }
  private mesmoUsuario(): boolean { return this.usuarioId !== null && this.auth.usuario()?.id === this.usuarioId && this.auth.usuario()?.tipoPessoa === 'ALUNO'; }
  podePagar(conta: CobrancaParaPagamento): boolean {
    return recebimentoPermitido(conta) && !this.pendente() && !this.armazenamentoBloqueado() && !this.consultando() && !this.pagando();
  }
  podeVerHistorico(conta: CobrancaParaPagamento): boolean { return conta.valorRecebido > 0 || conta.status === 'PAGO' || !!conta.avisos?.includes('RECEBIMENTO_NEGATIVO_LEGADO'); }
  validacao(): string {
    const valor = this.valorPago.value;
    if (!valorFinanceiroValido(valor, true)) return 'Informe um valor positivo com até duas casas decimais.';
    if (valor > (this.contaSelecionada()?.saldoRestante ?? 0)) return 'O valor não pode ultrapassar o saldo restante.';
    if (!FORMAS_PAGAMENTO.some(f => f.value === this.formaPagamento.value)) return 'Selecione a forma de pagamento.';
    return '';
  }
  abrirPagamento(conta: CobrancaParaPagamento): void {
    if (!this.mesmoUsuario() || !this.podePagar(conta) || this.carregandoRecibo()) return;
    this.erroPagamento.set(null); this.falhaRede.set(false); this.formaPagamento.setValue('PIX');
    this.contaSelecionada.set({ ...conta }); this.valorPago.setValue(conta.saldoRestante); this.consultarAntesDeConfirmar(false);
  }
  fecharPagamento(): void { if (!this.pagando() && !this.consultando()) { this.contaSelecionada.set(null); this.erroPagamento.set(null); } }
  confirmarPagamento(): void {
    if (this.pendente() || this.armazenamentoBloqueado() || !this.contaSelecionada() || this.pagando() || this.consultando() || this.validacao() || !this.mesmoUsuario()) return;
    this.consultarAntesDeConfirmar(true);
  }
  private consultarAntesDeConfirmar(enviar: boolean): void {
    const selecionada = this.contaSelecionada(); if (!selecionada || !this.mesmoUsuario()) return;
    let transferido = false;
    this.consultando.set(true); this.bloquearFormulario(true); this.erroPagamento.set(null);
    this.contas.listarMinhas().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { if (!transferido) this.consultando.set(false); this.bloquearFormulario(false); })).subscribe({
      next: lista => {
        if (!this.mesmoUsuario()) return;
        const atual = lista.find(c => c.id === selecionada.id);
        if (!atual || !recebimentoPermitido(atual)) { this.erroPagamento.set('Cobrança indisponível para pagamento. Atualize e procure a administração se houver avisos.'); this.contaSelecionada.set(atual ?? null); this.reconsultar.emit(); return; }
        this.contaSelecionada.set(atual);
        if (!enviar) { this.valorPago.setValue(atual.saldoRestante); return; }
        if (this.validacao()) { this.erroPagamento.set(this.validacao()); return; }
        let chave: string; try { chave = crypto.randomUUID(); } catch { this.erroPagamento.set('Não foi possível criar uma confirmação segura neste navegador.'); return; }
        const i: IntencaoRecebimento = { versao: 1, usuarioId: this.usuarioId!, contaId: atual.id, formaPagamento: this.formaPagamento.value, valorPago: this.valorPago.value!, chave, estado: 'INCERTA' };
        if (!this.persistencia?.salvar(i)) { this.armazenamentoBloqueado.set(true); this.erroPagamento.set('Não foi possível guardar a intenção. Nenhum pagamento foi enviado.'); return; }
        this.pendente.set(i); transferido = true; this.consultando.set(false); this.enviar(i, false);
      }, error: (e: HttpErrorResponse) => this.erroPagamento.set(mensagemApi(e)),
    });
  }
  repetirConfirmacao(): void {
    const i = this.pendente(); if (i?.estado === 'INCERTA' && !this.pagando() && !this.consultando() && this.mesmoUsuario()) this.enviar(i, true);
  }
  private enviar(i: IntencaoRecebimento, repeticao: boolean): void {
    if (!this.mesmoUsuario()) return;
    this.pagando.set(true); this.bloquearFormulario(true); this.erroPagamento.set(null);
    // A retentativa usa os parâmetros congelados, inclusive a ausência de valorPago.
    this.recebimentoService.pagar(i.contaId, i.formaPagamento, i.valorPago, i.chave)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.pagando.set(false); this.bloquearFormulario(false); })).subscribe({
        next: r => {
          if (!this.mesmoUsuario()) return;
          if (!r || r.contaId !== i.contaId || !Number.isSafeInteger(r.id) || !valorFinanceiroValido(r.valor, true)) {
            this.contaSelecionada.set(null); this.falhaRede.set(true); this.erroPagamento.set('Resposta inesperada. O pagamento pode ter sido registrado; confira antes de iniciar outra intenção.'); return;
          }
          this.pendente.set({ ...i, estado: 'REGISTRADA' }); this.persistencia?.salvar(this.pendente());
          this.contaRecibo.set(this.contaSelecionada()); this.contaSelecionada.set(null); this.recibo.set(r);
          this.falhaRede.set(false); this.eventos.invalidar(); this.conferido.set(false);
          this.messages.add({ severity: 'success', summary: 'Pagamento registrado', detail: 'O recibo corresponde a este recebimento. A matrícula pendente depende da quitação integral.', life: 5000 });
          this.concluido.emit(r);
          this.atualizarAposFalha(false);
        },
        error: (e: HttpErrorResponse) => {
          if (!this.mesmoUsuario()) return;
          this.erroPagamento.set(mensagemApi(e));
          if (!repeticao && [400, 404, 401, 403].includes(e.status)) {
            if (this.persistencia?.salvar(null)) this.pendente.set(null); else this.armazenamentoBloqueado.set(true);
            if (e.status !== 400) { this.contaSelecionada.set(null); this.reconsultar.emit(); }
          } else { this.contaSelecionada.set(null); this.falhaRede.set(true); this.conferido.set(false); this.erroPagamento.set(`${mensagemApi(e)} O pagamento pode ter sido registrado. Repita somente a confirmação original ou confira o histórico.`); }
          if (e.status === 409) this.reconsultar.emit();
        },
      });
  }
  /** Falha na atualização nunca repete POST. Outra intenção exige posição, recibos e perfil atualizados. */
  atualizarAposFalha(notificar = true): void {
    const i = this.pendente(); if (!i || this.consultando() || !this.mesmoUsuario()) return;
    this.consultando.set(true); this.conferido.set(false);
    forkJoin({ contas: this.contas.listarMinhas(), recibos: this.recebimentoService.listarRecibos(i.contaId), perfil: this.auth.carregarPerfil() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.consultando.set(false))).subscribe({
        next: ({ contas, recibos }) => {
          if (!this.mesmoUsuario()) return;
          const conta = contas.find(c => c.id === i.contaId);
          if (!conta || !posicaoReceberValida(conta)) { this.erroPagamento.set('Pagamento registrado ou pendente de conferência. Não foi possível obter a posição atual.'); return; }
          this.contaRecibo.set(conta); this.recibos.set(recibos); this.conferido.set(true); if (notificar) this.reconsultar.emit();
          if (i.estado === 'REGISTRADA') {
            if (this.persistencia?.salvar(null)) { this.pendente.set(null); this.erroPagamento.set(null); }
            else { this.armazenamentoBloqueado.set(true); this.erroPagamento.set('Pagamento registrado. Não foi possível limpar a intenção local; não reenvie.'); }
          } else this.historicoVisivel.set(true);
        }, error: (e: HttpErrorResponse) => this.erroPagamento.set(`${i.estado === 'REGISTRADA' ? 'Pagamento registrado; apenas atualize os dados. ' : 'Confirmação incerta; não inicie outro pagamento. '}${mensagemApi(e)}`),
      });
  }
  abandonarAposConferencia(): void {
    if (!this.mesmoUsuario() || !this.conferido() || this.pendente()?.estado !== 'INCERTA' || this.pagando() || this.consultando()) return;
    if (this.persistencia?.salvar(null)) { this.pendente.set(null); this.contaSelecionada.set(null); this.falhaRede.set(false); this.erroPagamento.set(null); this.reconsultar.emit(); }
  }
  visualizarRecibo(conta: CobrancaParaPagamento): void {
    if (!this.mesmoUsuario() || !this.podeVerHistorico(conta) || this.carregandoRecibo() || this.pagando()) return;
    this.contaRecibo.set({ ...conta }); this.recibos.set([]); this.historicoVisivel.set(true); this.erroHistorico.set(''); this.carregandoRecibo.set(true);
    this.recebimentoService.listarRecibos(conta.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoRecibo.set(false))).subscribe({
      next: lista => { if (this.mesmoUsuario()) this.recibos.set(lista); }, error: (e: HttpErrorResponse) => this.erroHistorico.set(mensagemApi(e)),
    });
  }
  abrirReciboExistente(r: ReciboMatricula): void { this.recibo.set(r); }
  fecharRecibo(): void { this.recibo.set(null); }
  private bloquearFormulario(bloqueado: boolean): void {
    const bloquear = bloqueado || this.pagando() || this.consultando() || !!this.pendente();
    for (const c of [this.valorPago, this.formaPagamento]) { if (bloquear) c.disable({ emitEvent: false }); else c.enable({ emitEvent: false }); }
  }
}
