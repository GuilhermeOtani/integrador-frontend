import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AssinaturaWhatsapp } from '../../models/whatsapp.models';
import { WhatsappService } from '../../service/whatsapp-service';
import { AtualizacaoLimitada } from '../../utils/atualizacao-limitada';
import { associarErrosWhatsapp, baixarPdfWhatsapp, erroWhatsapp, instanteWhatsapp, linkAtivacaoSeguro, normalizarNumero, validarNumero } from '../../utils/whatsapp.utils';

@Component({
  selector: 'app-assinatura-whatsapp', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, MessageModule, TagModule],
  templateUrl: './assinatura-whatsapp.html', styleUrl: './assinatura-whatsapp.css',
})
export class AssinaturaWhatsappComponent implements OnInit {
  private readonly service = inject(WhatsappService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly polling = new AtualizacaoLimitada();
  private consulta?: Subscription;
  readonly assinatura = signal<AssinaturaWhatsapp | null>(null);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly baixando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroPdf = signal<string | null>(null);
  readonly linkAtivacao = signal<string | null>(null);
  readonly editando = signal(false);
  readonly cancelamentoVisivel = signal(false);
  readonly instante = instanteWhatsapp;
  readonly form = new FormGroup({
    numero: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(40), validarNumero] }),
    aceite: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });
  constructor() { this.destroyRef.onDestroy(() => this.polling.parar()); }
  ngOnInit(): void { this.atualizar(); }
  atualizar(): void {
    if (this.salvando()) return;
    this.polling.parar(); this.consulta?.unsubscribe(); this.carregando.set(true); this.erro.set(null);
    this.consulta = this.service.minhaAssinatura().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: dados => { this.receber(dados); this.iniciarPolling(dados); },
      error: erro => { this.assinatura.set(null); void this.informarErro(erro); },
    });
  }
  private receber(dados: AssinaturaWhatsapp): void {
    this.assinatura.set(dados);
    if (!this.form.dirty && dados.numero) this.form.controls.numero.setValue(dados.numero);
    if (dados.status !== 'PENDENTE') this.linkAtivacao.set(null);
    if (dados.status === 'ATIVA') this.editando.set(false);
  }
  private iniciarPolling(dados: AssinaturaWhatsapp): void {
    if (dados.status !== 'PENDENTE') return;
    this.polling.iniciar(() => this.service.minhaAssinatura(), resposta => this.receber(resposta), erro => { void this.informarErro(erro as HttpErrorResponse); }, resposta => resposta.status === 'PENDENTE', dados.codigoExpiraEm);
  }
  trocarNumero(): void {
    this.form.reset({ numero: this.assinatura()?.numero ?? '', aceite: false }); this.editando.set(true);
  }
  solicitar(): void {
    if (this.form.invalid || this.salvando() || this.carregando()) { this.form.markAllAsTouched(); return; }
    this.polling.parar(); this.salvando.set(true); this.erro.set(null); this.linkAtivacao.set(null);
    const { numero, aceite } = this.form.getRawValue();
    this.service.solicitarAtivacao(normalizarNumero(numero), aceite).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))).subscribe({
      next: resposta => {
        this.receber(resposta.assinatura); this.editando.set(false); this.form.controls.aceite.reset(false);
        if (linkAtivacaoSeguro(resposta.linkAtivacao)) this.linkAtivacao.set(resposta.linkAtivacao);
        else this.erro.set('O link de ativação recebido não é válido. Atualize a situação antes de solicitar novamente.');
        this.iniciarPolling(resposta.assinatura);
      },
      error: erro => { associarErrosWhatsapp(this.form, erro); void this.informarErro(erro); },
    });
  }
  cancelar(): void {
    if (!this.cancelamentoVisivel() || this.salvando()) return;
    this.polling.parar(); this.consulta?.unsubscribe(); this.salvando.set(true); this.erro.set(null);
    this.service.cancelar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))).subscribe({
      next: () => { this.linkAtivacao.set(null); this.cancelamentoVisivel.set(false); this.editando.set(false); this.form.controls.aceite.reset(false); this.salvando.set(false); this.atualizar(); },
      error: erro => { void this.informarErro(erro); },
    });
  }
  baixarPdf(): void {
    if (this.baixando()) return;
    this.baixando.set(true); this.erroPdf.set(null);
    this.service.meuPdf().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.baixando.set(false))).subscribe({
      next: blob => baixarPdfWhatsapp(blob),
      error: async erro => { const mensagem = await erroWhatsapp(erro); if (!this.destroyRef.destroyed) this.erroPdf.set(mensagem); },
    });
  }
  private async informarErro(erro: HttpErrorResponse): Promise<void> {
    const mensagem = await erroWhatsapp(erro);
    if (!this.destroyRef.destroyed) this.erro.set(erro.status === 0 || erro.status >= 500 ? `${mensagem} Atualize a situação antes de uma nova solicitação.` : mensagem);
  }
}
