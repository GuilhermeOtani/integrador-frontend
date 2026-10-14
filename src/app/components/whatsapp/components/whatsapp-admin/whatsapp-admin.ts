import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { UsuarioResumo } from '../../../../core/auth/models/auth.models';
import { UsuarioService } from '../../../usuarios/service/usuario.service';
import { ConfiguracaoWhatsapp, HistoricoWhatsapp, LoteWhatsapp, PreviaWhatsapp, SolicitarEnvioWhatsapp } from '../../models/whatsapp.models';
import { WhatsappService } from '../../service/whatsapp-service';
import { AtualizacaoLimitada } from '../../utils/atualizacao-limitada';
import { associarErrosWhatsapp, baixarPdfWhatsapp, diaWhatsapp, EM_PROCESSAMENTO, erroWhatsapp, ESTADOS_ENTREGA, impedimentoWhatsapp, instanteWhatsapp, rotuloEntrega, severidadeEntrega, textoObrigatorio } from '../../utils/whatsapp.utils';

@Component({
  selector: 'app-whatsapp-admin', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, MessageModule, SelectModule, TableModule, TagModule, TextareaModule],
  templateUrl: './whatsapp-admin.html', styleUrl: './whatsapp-admin.css',
})
export class WhatsappAdmin implements OnInit {
  private readonly service = inject(WhatsappService);
  private readonly usuariosService = inject(UsuarioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly polling = new AtualizacaoLimitada();
  private previaConsulta?: Subscription;
  private historicoConsulta?: Subscription;
  private loteConsulta?: Subscription;
  private pdfConsulta?: Subscription;
  readonly configuracao = signal<ConfiguracaoWhatsapp | null>(null);
  readonly configCarregando = signal(false);
  readonly configSalvando = signal(false);
  readonly configErro = signal<string | null>(null);
  readonly pronta = computed(() => { const c = this.configuracao(); return !!c && c.integracaoHabilitada && c.credenciaisConfiguradas && c.webhookVerificado && c.templateVerificado; });
  readonly usuarios = signal<UsuarioResumo[]>([]);
  readonly usuariosCarregando = signal(false);
  readonly usuariosErro = signal<string | null>(null);
  readonly usuarioSelecionado = new FormControl<number | null>(null);
  readonly previa = signal<PreviaWhatsapp | null>(null);
  readonly previaCarregando = signal(false);
  readonly previaErro = signal<string | null>(null);
  readonly pdfErro = signal<string | null>(null);
  readonly baixando = signal(false);
  readonly historico = signal<HistoricoWhatsapp | null>(null);
  readonly historicoCarregando = signal(false);
  readonly historicoErro = signal<string | null>(null);
  readonly pagina = signal(0);
  readonly tamanho = signal(20);
  readonly lote = signal<LoteWhatsapp | null>(null);
  readonly loteId = signal<string | null>(null);
  readonly loteVisivel = signal(false);
  readonly loteCarregando = signal(false);
  readonly loteErro = signal<string | null>(null);
  readonly envioVisivel = signal(false);
  readonly reenvio = signal(false);
  readonly enviando = signal(false);
  readonly envioErro = signal<string | null>(null);
  readonly intencao = signal<SolicitarEnvioWhatsapp | null>(null);
  readonly resultadoIncerto = signal(false);
  readonly aviso = signal<string | null>(null);
  readonly envioForm = new FormGroup({
    publico: new FormControl<'TODOS' | 'ALUNOS' | 'MOTORISTAS'>('TODOS', { nonNullable: true, validators: [Validators.required] }),
    motivo: new FormControl('', { nonNullable: true }),
  });
  readonly publicos = [{ label: 'Alunos e motoristas', value: 'TODOS' }, { label: 'Alunos', value: 'ALUNOS' }, { label: 'Motoristas', value: 'MOTORISTAS' }];
  readonly estados = ESTADOS_ENTREGA;
  readonly rotulo = rotuloEntrega;
  readonly severidade = severidadeEntrega;
  readonly impedimento = impedimentoWhatsapp;
  readonly instante = instanteWhatsapp;
  readonly dia = diaWhatsapp;
  constructor() { this.destroyRef.onDestroy(() => this.polling.parar()); }
  ngOnInit(): void {
    this.carregarConfiguracao(); this.carregarUsuarios(); this.carregarHistorico();
    this.usuarioSelecionado.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.carregarPrevia());
  }
  carregarConfiguracao(): void {
    if (this.configCarregando() || this.configSalvando()) return;
    this.configCarregando.set(true); this.configErro.set(null);
    this.service.configuracao().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.configCarregando.set(false))).subscribe({
      next: c => this.configuracao.set(c), error: erro => { this.configuracao.set(null); void this.mostrarErro(this.configErro, erro); },
    });
  }
  alternarAutomatico(): void {
    const c = this.configuracao();
    if (!c || this.configSalvando() || this.configCarregando() || (!c.automatico && !this.pronta())) return;
    this.configSalvando.set(true); this.configErro.set(null);
    this.service.configurarAutomatico(!c.automatico).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.configSalvando.set(false))).subscribe({
      next: dados => this.configuracao.set(dados), error: erro => { void this.mostrarErro(this.configErro, erro); },
    });
  }
  carregarUsuarios(): void {
    if (this.usuariosCarregando()) return;
    this.usuariosCarregando.set(true); this.usuariosErro.set(null);
    this.usuariosService.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.usuariosCarregando.set(false))).subscribe({
      next: dados => this.usuarios.set(dados.filter(u => u.tipoPessoa === 'ALUNO' || u.tipoPessoa === 'MOTORISTA')),
      error: erro => { this.usuarios.set([]); void this.mostrarErro(this.usuariosErro, erro); },
    });
  }
  carregarPrevia(): void {
    this.previaConsulta?.unsubscribe(); this.pdfConsulta?.unsubscribe(); this.previa.set(null); this.previaErro.set(null); this.pdfErro.set(null);
    const id = this.usuarioSelecionado.value;
    if (id === null) return;
    this.previaCarregando.set(true);
    this.previaConsulta = this.service.previa(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.previaCarregando.set(false))).subscribe({
      next: dados => this.previa.set(dados), error: erro => { void this.mostrarErro(this.previaErro, erro, () => this.usuarioSelecionado.value === id); },
    });
  }
  baixarPrevia(): void {
    const id = this.usuarioSelecionado.value;
    if (id === null || this.baixando() || !this.previa()) return;
    this.baixando.set(true); this.pdfErro.set(null);
    this.pdfConsulta = this.service.previaPdf(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.baixando.set(false))).subscribe({
      next: blob => baixarPdfWhatsapp(blob), error: erro => { void this.mostrarErro(this.pdfErro, erro, () => this.usuarioSelecionado.value === id); },
    });
  }
  carregarHistorico(): void {
    this.historicoConsulta?.unsubscribe(); this.historico.set(null); this.historicoCarregando.set(true); this.historicoErro.set(null);
    this.historicoConsulta = this.service.historico(this.pagina(), this.tamanho()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.historicoCarregando.set(false))).subscribe({
      next: dados => this.historico.set(dados), error: erro => { void this.mostrarErro(this.historicoErro, erro); },
    });
  }
  paginar(evento: { first?: number; rows?: number }): void {
    const tamanho = evento.rows ?? this.tamanho();
    const pagina = tamanho !== this.tamanho() ? 0 : Math.floor((evento.first ?? 0) / tamanho);
    if (pagina === this.pagina() && tamanho === this.tamanho()) return;
    this.pagina.set(pagina); this.tamanho.set(tamanho); this.carregarHistorico();
  }
  abrirEnvio(reenvio: boolean): void {
    if (this.enviando() || !this.pronta()) return;
    if (!this.resultadoIncerto()) {
      this.reenvio.set(reenvio); this.intencao.set(null); this.envioErro.set(null);
      this.envioForm.reset({ publico: 'TODOS', motivo: '' });
      this.envioForm.controls.motivo.setValidators(reenvio ? [textoObrigatorio, Validators.maxLength(500)] : []);
      this.envioForm.controls.motivo.updateValueAndValidity(); this.envioForm.enable();
    }
    this.envioVisivel.set(true);
  }
  enviar(): void {
    if (this.enviando() || this.envioForm.invalid || !this.envioVisivel() || !this.pronta()) { this.envioForm.markAllAsTouched(); return; }
    let intencao = this.intencao();
    if (!intencao) {
      const dados = this.envioForm.getRawValue();
      intencao = { requestId: crypto.randomUUID(), publico: dados.publico, reenviar: this.reenvio(), motivo: this.reenvio() ? dados.motivo.trim() : null };
      this.intencao.set(intencao);
    }
    this.enviando.set(true); this.envioErro.set(null); this.envioForm.disable();
    this.service.enviar(intencao).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false))).subscribe({
      next: lote => this.envioRegistrado(lote),
      error: erro => {
        if (erro.status === 0 || erro.status >= 500) {
          this.resultadoIncerto.set(true); this.envioVisivel.set(false); this.carregarHistorico(); this.abrirLote(this.intencao()!.requestId);
        } else { this.resultadoIncerto.set(false); this.intencao.set(null); this.envioForm.enable(); associarErrosWhatsapp(this.envioForm, erro); }
        void this.mostrarErro(this.envioErro, erro);
      },
    });
  }
  private envioRegistrado(lote: LoteWhatsapp): void {
    this.aviso.set('Lote registrado para processamento. A entrega será confirmada pelos estados do histórico.');
    this.envioVisivel.set(false); this.resultadoIncerto.set(false); this.intencao.set(null); this.envioForm.enable();
    this.carregarHistorico(); this.abrirLote(lote.id);
  }
  abrirLote(id: string): void { this.loteId.set(id); this.loteVisivel.set(true); this.atualizarLote(); }
  atualizarLote(): void {
    const id = this.loteId(); if (!id) return;
    this.polling.parar(); this.loteConsulta?.unsubscribe(); this.lote.set(null); this.loteErro.set(null); this.loteCarregando.set(true);
    this.loteConsulta = this.service.lote(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loteCarregando.set(false))).subscribe({
      next: dados => { this.receberLote(dados); this.iniciarPolling(dados); },
      error: erro => { void this.mostrarErro(this.loteErro, erro); },
    });
  }
  private receberLote(dados: LoteWhatsapp): void {
    this.lote.set(dados);
    if (this.resultadoIncerto() && this.intencao()?.requestId === dados.id) {
      this.resultadoIncerto.set(false); this.intencao.set(null); this.envioVisivel.set(false); this.envioForm.enable();
      this.aviso.set('Lote localizado no histórico. Não solicite novamente o mesmo envio.');
    }
  }
  private iniciarPolling(dados: LoteWhatsapp): void {
    const continuar = (lote: LoteWhatsapp) => EM_PROCESSAMENTO.some(estado => lote.totais[estado] > 0);
    if (!continuar(dados) || !this.loteVisivel()) return;
    this.polling.iniciar(() => this.service.lote(dados.id), lote => this.receberLote(lote), erro => { this.lote.set(null); void this.mostrarErro(this.loteErro, erro as HttpErrorResponse); }, continuar);
  }
  fecharLote(): void { this.polling.parar(); this.loteConsulta?.unsubscribe(); this.loteVisivel.set(false); }
  private async mostrarErro(destino: { set: (valor: string | null) => void }, erro: HttpErrorResponse, atual = () => true): Promise<void> {
    const mensagem = await erroWhatsapp(erro); if (!this.destroyRef.destroyed && atual()) destino.set(mensagem);
  }
}
