import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ManutencaoService } from '../../service/manutencao.service';
import { ChamadoManutencao, OnibusChamado } from '../../models/manutencao.models';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { CAMPOS_PESQUISA_CHAMADO, errosNosControles, textoObrigatorio, rotuloOnibus, rotuloPrioridade, rotuloAndamento, severidadeAndamento, severidadePrioridade } from '../../utils/manutencao.utils';
import { ChamadoDetalhe } from '../chamado-detalhe/chamado-detalhe';

@Component({
  standalone: true,
  selector: 'app-meus-chamados',
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, DialogModule, SelectModule, TableModule,
    TextareaModule, InputTextModule, ToolbarModule, TagModule, ChamadoDetalhe],
  templateUrl: './meus-chamados.html',
  styleUrl: '../../styles/manutencao.css',
})
export class MeusChamados implements OnInit {
  private readonly api = inject(ManutencaoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private consultaOnibus?: Subscription;
  readonly chamados = signal<ChamadoManutencao[]>([]);
  readonly onibus = signal<OnibusChamado[]>([]);
  readonly carregando = signal(false);
  readonly carregandoOnibus = signal(false);
  readonly salvando = signal(false);
  readonly carregandoDetalhe = signal(false);
  readonly detalhe = signal<ChamadoManutencao | null>(null);
  readonly erroLista = signal('');
  readonly erroOnibus = signal('');
  readonly erroForm = signal('');
  novoAberto = false;
  detalhesAberto = false;
  readonly camposPesquisa = CAMPOS_PESQUISA_CHAMADO;
  readonly rotuloOnibus = rotuloOnibus;
  readonly prioridade = rotuloPrioridade;
  readonly andamento = rotuloAndamento;
  readonly corPrioridade = severidadePrioridade;
  readonly corAndamento = severidadeAndamento;
  readonly opcoesOnibus = computed(() => this.onibus().map(o => ({ id: o.id, label: rotuloOnibus(o) })));
  readonly form = this.fb.group({
    onibusId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    descricao: this.fb.nonNullable.control('', [textoObrigatorio, Validators.maxLength(2000)]),
  });

  ngOnInit() { this.carregar(); this.carregarOnibus(); }
  carregar() {
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.erroLista.set('');
    this.consulta = this.api.minhas().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: lista => this.chamados.set(lista),
      error: e => { this.chamados.set([]); this.erroLista.set(mensagemApi(e)); },
    });
  }
  carregarOnibus() {
    this.consultaOnibus?.unsubscribe();
    this.carregandoOnibus.set(true);
    this.erroOnibus.set('');
    this.consultaOnibus = this.api.listarOnibus().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoOnibus.set(false))).subscribe({
      next: lista => this.onibus.set(lista),
      error: e => this.erroOnibus.set(mensagemApi(e)),
    });
  }
  abrirFormulario() {
    this.form.reset({ onibusId: null, descricao: '' });
    this.erroForm.set('');
    this.novoAberto = true;
    this.carregarOnibus();
  }
  enviar() {
    if (this.salvando() || this.carregandoOnibus() || this.erroOnibus()) return;
    this.form.markAllAsTouched();
    const { onibusId, descricao } = this.form.getRawValue();
    if (this.form.invalid || onibusId === null) return;
    this.salvando.set(true);
    this.erroForm.set('');
    this.api.abrir({ onibusId, descricao: descricao.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))).subscribe({
        next: () => {
          this.novoAberto = false;
          this.form.reset({ onibusId: null, descricao: '' });
          this.messages.add({ severity: 'success', summary: 'Chamado enviado', detail: 'Acompanhe a resposta nesta tela.' });
          this.carregar();
        },
        error: (e: HttpErrorResponse) => {
          this.erroForm.set(mensagemApi(e) + (e.status === 0 ? ' Atualize a lista antes de reenviar: o chamado pode ter sido registrado.' : ''));
          errosNosControles(this.form, e);
          if (e.status === 404) this.carregarOnibus();
        },
      });
  }
  ver(id: number) {
    if (this.carregandoDetalhe()) return;
    this.detalhe.set(null);
    this.detalhesAberto = true;
    this.carregandoDetalhe.set(true);
    this.api.buscar(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoDetalhe.set(false))).subscribe({
      next: chamado => this.detalhe.set(chamado),
      error: (e: HttpErrorResponse) => {
        this.detalhesAberto = false;
        if (![0, 401, 403].includes(e.status)) this.messages.add({ severity: 'error', summary: 'Detalhes indisponíveis', detail: mensagemApi(e) });
      },
    });
  }
}
