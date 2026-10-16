import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ManutencaoService } from '../../service/manutencao.service';
import { AtenderChamado, ChamadoManutencao, FiltrosChamado, OnibusChamado, PrioridadeChamado,
  StatusChamado, StatusOnibus, PRIORIDADES, ESTADOS_CHAMADO, ESTADOS_ONIBUS } from '../../models/manutencao.models';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { CAMPOS_PESQUISA_CHAMADO, errosNosControles, idOnibusParametro, textoObrigatorio, rotuloOnibus,
  rotuloPrioridade, rotuloAndamento, papelSolicitante, severidadeAndamento, severidadePrioridade } from '../../utils/manutencao.utils';
import { ChamadoDetalhe } from '../chamado-detalhe/chamado-detalhe';

@Component({
  standalone: true,
  selector: 'app-manutencao-admin',
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, CheckboxModule, DialogModule, SelectModule,
    TableModule, TextareaModule, InputTextModule, ToolbarModule, TagModule, ChamadoDetalhe],
  templateUrl: './manutencao-admin.html',
  styleUrls: ['../../styles/manutencao.css', './manutencao-admin.css'],
})
export class ManutencaoAdmin implements OnInit {
  private readonly api = inject(ManutencaoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private consulta?: Subscription;
  private consultaOnibus?: Subscription;
  private filtrosAplicados: FiltrosChamado = {};
  private parametroAtual: number | null = null;
  readonly prioridades = PRIORIDADES;
  readonly estados = ESTADOS_CHAMADO;
  readonly estadosOnibus = ESTADOS_ONIBUS;
  readonly camposPesquisa = CAMPOS_PESQUISA_CHAMADO;
  readonly rotuloOnibus = rotuloOnibus;
  readonly prioridade = rotuloPrioridade;
  readonly andamento = rotuloAndamento;
  readonly papel = papelSolicitante;
  readonly corPrioridade = severidadePrioridade;
  readonly corAndamento = severidadeAndamento;
  readonly chamados = signal<ChamadoManutencao[]>([]);
  readonly onibus = signal<OnibusChamado[]>([]);
  readonly carregando = signal(false);
  readonly carregandoOnibus = signal(false);
  readonly abrindo = signal(false);
  readonly salvando = signal(false);
  readonly selecionado = signal<ChamadoManutencao | null>(null);
  readonly erroLista = signal('');
  readonly erroOnibus = signal('');
  readonly erroForm = signal('');
  dialogoAberto = false;
  pesquisaLocal = '';
  readonly opcoesOnibus = computed(() => this.onibus().map(o => ({ id: o.id, label: rotuloOnibus(o) })));
  readonly filtros = this.fb.group({
    status: this.fb.control<StatusChamado | null>(null),
    urgencia: this.fb.control<PrioridadeChamado | null>(null),
    onibusId: this.fb.control<number | null>(null),
  });
  readonly form = this.fb.group({
    urgencia: this.fb.nonNullable.control<PrioridadeChamado>('MEDIA', Validators.required),
    status: this.fb.nonNullable.control<StatusChamado>('ABERTO', Validators.required),
    observacaoAdmin: this.fb.nonNullable.control('', Validators.maxLength(2000)),
    alterarOnibus: this.fb.nonNullable.control(false),
    statusOnibus: this.fb.control<StatusOnibus | null>({ value: null, disabled: true }),
  });

  constructor() {
    this.form.controls.status.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.atualizarValidadores());
    this.form.controls.alterarOnibus.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.atualizarValidadores());
  }
  ngOnInit() {
    this.carregarOnibus();
    let primeiraConsulta = true;
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = idOnibusParametro(params.get('onibusId'));
      if (!primeiraConsulta && id === this.parametroAtual) return;
      primeiraConsulta = false;
      this.parametroAtual = id;
      this.filtros.controls.onibusId.setValue(id);
      this.aplicar();
    });
  }
  aplicar() {
    const { status, urgencia, onibusId } = this.filtros.getRawValue();
    this.filtrosAplicados = {
      ...(status ? { status } : {}), ...(urgencia ? { urgencia } : {}),
      ...(onibusId ? { onibusId } : {}),
    };
    this.carregar();
  }
  limpar() {
    this.filtros.reset();
    this.filtrosAplicados = {};
    this.parametroAtual = null;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { onibusId: null }, queryParamsHandling: 'merge', replaceUrl: true });
    this.carregar();
  }
  carregar() {
    // Cancel stale GETs when filters change, never retry a mutation automatically.
    this.consulta?.unsubscribe();
    this.carregando.set(true);
    this.erroLista.set('');
    this.consulta = this.api.listar(this.filtrosAplicados)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
        next: lista => this.chamados.set(lista),
        error: e => { this.chamados.set([]); this.erroLista.set(mensagemApi(e)); },
      });
  }
  carregarOnibus() {
    this.consultaOnibus?.unsubscribe();
    this.carregandoOnibus.set(true);
    this.erroOnibus.set('');
    this.consultaOnibus = this.api.listarOnibus().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoOnibus.set(false))).subscribe({
      next: lista => this.onibus.set(lista), error: e => this.erroOnibus.set(mensagemApi(e)),
    });
  }
  atender(id: number) {
    if (this.abrindo() || this.salvando()) return;
    this.selecionado.set(null);
    this.erroForm.set('');
    this.dialogoAberto = true;
    this.abrindo.set(true);
    this.api.buscar(id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.abrindo.set(false))).subscribe({
      next: chamado => {
        this.selecionado.set(chamado);
        this.form.reset({ urgencia: chamado.urgencia, status: chamado.status,
          observacaoAdmin: chamado.observacaoAdmin ?? '', alterarOnibus: false,
          statusOnibus: chamado.onibus.statusOnibus });
        this.atualizarValidadores();
      },
      error: (e: HttpErrorResponse) => {
        this.dialogoAberto = false;
        this.notificarErro(e);
        if (e.status === 404) { this.carregar(); this.carregarOnibus(); }
      },
    });
  }
  private atualizarValidadores() {
    const controles = this.form.controls;
    controles.observacaoAdmin.setValidators([
      Validators.maxLength(2000), ...(controles.status.value === 'RESOLVIDO' ? [textoObrigatorio] : []),
    ]);
    controles.observacaoAdmin.updateValueAndValidity({ emitEvent: false });
    if (controles.alterarOnibus.value) {
      controles.statusOnibus.setValidators(Validators.required);
      controles.statusOnibus.enable({ emitEvent: false });
    } else {
      controles.statusOnibus.clearValidators();
      controles.statusOnibus.disable({ emitEvent: false });
    }
    controles.statusOnibus.updateValueAndValidity({ emitEvent: false });
  }
  salvar() {
    if (this.salvando() || this.abrindo()) return;
    this.form.markAllAsTouched();
    const chamado = this.selecionado();
    if (this.form.invalid || !chamado) return;
    const valor = this.form.getRawValue();
    const body: AtenderChamado = {
      urgencia: valor.urgencia, status: valor.status, observacaoAdmin: valor.observacaoAdmin.trim() || null,
      ...(valor.alterarOnibus && valor.statusOnibus ? { statusOnibus: valor.statusOnibus } : {}),
    };
    this.erroForm.set('');
    this.salvando.set(true);
    this.api.atender(chamado.id, body).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.dialogoAberto = false;
        this.selecionado.set(null);
        this.messages.add({ severity: 'success', summary: 'Atendimento salvo', detail: 'Chamados e estados dos ônibus atualizados.' });
        this.carregar(); this.carregarOnibus();
      },
      error: (e: HttpErrorResponse) => {
        this.erroForm.set(mensagemApi(e));
        errosNosControles(this.form, e);
        if (e.status === 404) {
          this.dialogoAberto = false; this.selecionado.set(null);
          this.notificarErro(e); this.carregar(); this.carregarOnibus();
        }
      },
    });
  }
  private notificarErro(e: HttpErrorResponse) {
    if (![0, 401, 403].includes(e.status)) this.messages.add({ severity: 'error', summary: 'Não foi possível concluir', detail: mensagemApi(e) });
  }
}
