import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, exhaustMap, finalize, Subscription, takeUntil, tap, timer, catchError } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { mensagemApi, problemaApi } from '../../../../core/auth/utils/api-error';
import { ViagemResumo } from '../../../dashboard/models/dashboard.models';
import { ESTADOS_ONIBUS } from '../../../manutencao/models/manutencao.models';
import { ConfiguracaoEmail, HistoricoEmail, LoteEmail, PreviaEmail } from '../../models/email-programacao.models';
import { EmailProgramacaoService } from '../../service/email-programacao-service';
import { ConsultaEmail } from '../../utils/consulta-email';
import { agruparProgramacao, diaEmail, diaSaoPaulo, ESTADOS_EMAIL, instanteEmail, rotuloEmail, severidadeEmail, textoEmail, textoObrigatorio } from '../../utils/email-programacao.utils';
import { IntencaoEmail, SolicitacaoPendente } from '../../utils/solicitacao-pendente';

@Component({
  selector: 'app-email-programacao', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, MessageModule, TableModule, TagModule, TextareaModule],
  templateUrl: './email-programacao.html',
  styleUrls: ['./email-programacao.css', '../../../dashboard/styles/dialog-dashboard.css'],
})
export class EmailProgramacao implements OnInit {
  private readonly api = inject(EmailProgramacaoService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private armazenamento?: SolicitacaoPendente;
  private adminId?: number;
  private polling?: Subscription;
  readonly config = new ConsultaEmail<ConfiguracaoEmail>();
  readonly previa = new ConsultaEmail<PreviaEmail>();
  readonly historico = new ConsultaEmail<HistoricoEmail>();
  readonly detalhe = new ConsultaEmail<LoteEmail>();
  readonly pagina = signal(0);
  readonly tamanho = signal(20);
  readonly pesquisa = signal('');
  readonly grupos = computed(() => agruparProgramacao(this.previa.dados()?.viagens ?? [], this.pesquisa()));
  readonly enviando = signal(false);
  readonly configurando = signal(false);
  readonly envioVisivel = signal(false);
  readonly automaticoVisivel = signal(false);
  readonly detalheVisivel = signal(false);
  readonly mensagemVisivel = signal(false);
  readonly viagemDetalhe = signal<ViagemResumo | null>(null);
  readonly reenvio = signal(false);
  readonly retomando = signal(false);
  readonly intencao = signal<IntencaoEmail | null>(null);
  readonly pendenciaNaoLocalizada = signal(false);
  readonly resolucaoVisivel = signal(false);
  readonly detalheId = signal<string | null>(null);
  readonly erroEnvio = signal<string | null>(null);
  readonly erroConfiguracao = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly avisoStorage = signal<string | null>(null);
  readonly pollingExpirou = signal(false);
  readonly motivo = new FormControl('', { nonNullable: true, validators: [textoObrigatorio, Validators.maxLength(500)] });
  readonly podeEnviar = computed(() => this.consultasValidas() && !!this.previa.dados()?.viagens.length &&
    (this.previa.dados()?.destinatariosElegiveis ?? 0) > 0 && !this.intencao());
  readonly podeRetomar = computed(() => this.consultasValidas() && this.intencao()?.dataReferencia === this.previa.dados()?.dataReferencia);
  readonly podeResolverAntiga = computed(() => !!this.intencao() && this.pendenciaNaoLocalizada() &&
    !!this.previa.dados() && this.intencao()?.dataReferencia !== this.previa.dados()?.dataReferencia && !this.previa.erro() && !this.previa.carregando());
  readonly dia = diaEmail;
  readonly instante = instanteEmail;
  readonly texto = textoEmail;
  readonly estados = ESTADOS_EMAIL;
  readonly rotulo = rotuloEmail;
  readonly severidade = severidadeEmail;

  constructor() { this.destroyRef.onDestroy(() => this.pararPolling()); }
  ngOnInit(): void {
    this.adminId = this.auth.usuario()?.id;
    if (this.adminId) {
      this.armazenamento = new SolicitacaoPendente(this.adminId);
      this.intencao.set(this.armazenamento.restaurar());
    }
    this.motivo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.motivo.hasError('servidor')) { const erros = { ...this.motivo.errors }; delete erros['servidor']; this.motivo.setErrors(Object.keys(erros).length ? erros : null); }
    });
    this.atualizar();
  }
  private identidadeValida(): boolean { return this.auth.temPapel('ADMIN') && !!this.adminId && this.auth.usuario()?.id === this.adminId; }
  private consultasValidas(): boolean {
    return !!this.config.dados()?.disponivel && !this.config.carregando() && !this.config.erro() &&
      !!this.previa.dados() && !this.previa.carregando() && !this.previa.erro() &&
      !this.enviando() && !this.configurando();
  }
  private diaAtual(): boolean {
    if (this.previa.dados()?.dataReferencia === diaSaoPaulo()) return true;
    this.erroEnvio.set('O dia mudou ou a prévia não é de hoje. Atualize a programação antes de enviar.'); return false;
  }
  atualizar(): void {
    if (this.enviando() || this.configurando()) return;
    this.config.carregar(this.api.configuracao()); this.previa.carregar(this.api.previa()); this.carregarHistorico();
  }
  carregarHistorico(): void { this.historico.carregar(this.api.historico(this.pagina(), this.tamanho())); }
  paginar(evento: { first?: number; rows?: number }): void {
    const tamanho = evento.rows ?? this.tamanho();
    if (![20, 50, 100].includes(tamanho)) return;
    const pagina = tamanho !== this.tamanho() ? 0 : Math.floor((evento.first ?? 0) / tamanho);
    if (pagina < 0 || (pagina === this.pagina() && tamanho === this.tamanho())) return;
    this.pagina.set(pagina); this.tamanho.set(tamanho); this.carregarHistorico();
  }
  abrirEnvio(reenvio: boolean): void {
    if (!this.podeEnviar() || !this.identidadeValida() || !this.diaAtual()) return;
    this.reenvio.set(reenvio); this.retomando.set(false); this.motivo.reset(''); this.erroEnvio.set(null); this.envioVisivel.set(true);
  }
  retomar(): void {
    if (!this.podeRetomar() || !this.identidadeValida() || !this.diaAtual()) return;
    this.reenvio.set(this.intencao()!.request.reenviar); this.retomando.set(true);
    this.motivo.setValue(this.intencao()!.request.motivo ?? ''); this.envioVisivel.set(true);
  }
  private persistir(intencao: IntencaoEmail | null): void {
    this.intencao.set(intencao); this.pendenciaNaoLocalizada.set(false);
    if (!this.armazenamento?.salvar(intencao)) this.avisoStorage.set('Não foi possível salvar a recuperação nesta aba. Não recarregue antes de conferir o resultado no histórico.');
    else this.avisoStorage.set(null);
  }
  confirmarEnvio(): void {
    if (!this.envioVisivel() || !this.identidadeValida() || !this.diaAtual() || this.enviando()) return;
    const pendente = this.intencao();
    if (pendente ? !this.retomando() || !this.podeRetomar() : !this.podeEnviar()) return;
    if (!pendente && this.reenvio() && this.motivo.invalid) { this.motivo.markAsTouched(); return; }
    const intencao: IntencaoEmail = pendente ?? {
      versao: 1, adminId: this.adminId!, dataReferencia: this.previa.dados()!.dataReferencia, criadoEm: new Date().toISOString(),
      request: { requestId: crypto.randomUUID(), reenviar: this.reenvio(), ...(this.reenvio() ? { motivo: this.motivo.value.trim() } : {}) },
    };
    this.persistir(intencao); this.enviando.set(true); this.erroEnvio.set(null);
    this.api.enviar(intencao.request).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false))).subscribe({
      next: lote => {
        this.persistir(null); this.envioVisivel.set(false); this.retomando.set(false);
        this.aviso.set('Lote registrado para processamento. Aceite SMTP não comprova entrega na caixa de entrada.');
        this.pararPolling(); this.detalhe.limpar(); this.detalheId.set(lote.id); this.detalhe.dados.set(lote); this.detalheVisivel.set(true); this.iniciarPolling(lote);
        this.pagina.set(0); this.previa.carregar(this.api.previa()); this.carregarHistorico();
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 400) {
          this.persistir(null); this.retomando.set(false);
          const validacao = problemaApi(erro)?.errors?.['motivo'];
          if (validacao) { this.motivo.setErrors({ ...this.motivo.errors, servidor: validacao }); this.motivo.markAsTouched(); }
        } else {
          this.retomando.set(true);
          if (erro.status === 0 || erro.status === 408 || erro.status >= 500) this.envioVisivel.set(false);
        }
        this.erroEnvio.set(erro.status === 0 || erro.status === 408 || erro.status >= 500
          ? `${erro.status === 503 ? mensagemApi(erro) + ' ' : ''}Não foi possível confirmar o registro. Consulte a solicitação antes de repetir com o mesmo identificador.`
          : mensagemApi(erro));
      },
    });
  }
  consultarPendente(): void { if (this.intencao() && !this.enviando()) this.abrirDetalhe(this.intencao()!.request.requestId); }
  resolverAntiga(): void {
    if (!this.podeResolverAntiga() || !this.identidadeValida() || this.enviando() || !this.resolucaoVisivel()) return;
    this.persistir(null); this.resolucaoVisivel.set(false); this.erroEnvio.set(null);
    this.aviso.set('Pendência de outro dia encerrada localmente. Uma nova ação usará a programação de hoje.');
  }
  solicitarAutomatico(): void {
    const c = this.config.dados();
    if (!c || !this.identidadeValida() || this.configurando() || this.enviando() || this.config.carregando() || this.config.erro()) return;
    if (c.automatico) this.salvarAutomatico(false);
    else if (c.disponivel) this.automaticoVisivel.set(true);
  }
  confirmarAutomatico(): void {
    if (this.automaticoVisivel() && this.config.dados()?.disponivel && !this.config.erro() && !this.config.carregando()) this.salvarAutomatico(true);
  }
  private salvarAutomatico(automatico: boolean): void {
    if (this.configurando() || this.enviando() || !this.identidadeValida()) return;
    this.configurando.set(true); this.erroConfiguracao.set(null);
    this.api.configurar(automatico).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.configurando.set(false))).subscribe({
      next: c => { this.config.dados.set(c); this.automaticoVisivel.set(false); this.aviso.set(c.automatico ? 'Automático ativado no servidor.' : 'Automático desativado. Mensagens já enfileiradas não foram canceladas.'); },
      error: erro => this.erroConfiguracao.set(mensagemApi(erro)),
    });
  }
  abrirDetalhe(id: string): void {
    this.pararPolling();
    if (this.detalheId() !== id) this.detalhe.limpar();
    this.detalheId.set(id); this.detalheVisivel.set(true); this.atualizarDetalhe();
  }
  atualizarDetalhe(): void {
    const id = this.detalheId(); if (!id || !this.detalheVisivel()) return;
    this.pararPolling();
    this.detalhe.carregar(this.api.detalhe(id), lote => { this.receberDetalhe(lote); this.iniciarPolling(lote); }, erro => {
      if (erro.status === 404 && this.intencao()?.request.requestId === id) this.pendenciaNaoLocalizada.set(true);
      if (erro.status === 404) { this.detalhe.dados.set(null); this.carregarHistorico(); }
    });
  }
  private receberDetalhe(lote: LoteEmail): void {
    this.detalhe.dados.set(lote);
    if (this.intencao()?.request.requestId === lote.id) { this.persistir(null); this.envioVisivel.set(false); this.retomando.set(false); this.aviso.set('Solicitação localizada. Confira o resultado, sem criar outro envio para substituí-la.'); }
  }
  private iniciarPolling(lote: LoteEmail): void {
    this.pararPolling(); this.pollingExpirou.set(false);
    if (!this.processando(lote) || !this.detalheVisivel()) return;
    this.polling = timer(5000, 5000).pipe(
      exhaustMap(() => this.api.detalhe(lote.id).pipe(catchError((erro: HttpErrorResponse) => {
        this.detalhe.erro.set(mensagemApi(erro)); this.detalhe.statusErro.set(erro.status); this.pararPolling(); return EMPTY;
      }))),
      takeUntil(timer(600000).pipe(tap(() => this.pollingExpirou.set(true)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(dados => { this.receberDetalhe(dados); if (!this.processando(dados)) this.pararPolling(); });
  }
  private processando(lote: LoteEmail): boolean { return lote.totais.PENDENTE > 0 || lote.totais.PROCESSANDO > 0; }
  private pararPolling(): void { this.polling?.unsubscribe(); this.polling = undefined; }
  fecharDetalhe(): void { this.pararPolling(); this.detalhe.limpar(); this.detalheVisivel.set(false); }
  avisosViagem(v: ViagemResumo): string[] {
    return [...new Set([...v.avisos, ...(!v.onibusDisponivel && !v.avisos.length ? ['Ônibus indisponível. Confirme o transporte com a administração.'] : [])])];
  }
  estadoOnibus(valor: string | null | undefined): string { return ESTADOS_ONIBUS.find(e => e.value === valor)?.label ?? 'Não informado'; }
}
