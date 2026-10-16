import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ContaPagarService } from '../../service/conta-pagar-service';
import { PagamentoService } from '../../service/pagamento-service';
import { Beneficiario, BeneficiariosService } from '../../../../core/financeiro/beneficiarios.service';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { ClassificacaoConta, ContaPagarRequest, ContaPagarResponse } from '../../../relatorios/models/relatorios.models';
import { dataFinanceiraValida, idFinanceiroValido, mesFinanceiroValido, textoFinanceiro, valorFinanceiroValido } from '../../../../core/financeiro/financeiro.utils';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
@Component({
  selector: 'app-conta-editor', standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, SelectModule, MessageModule],
  templateUrl: './conta-editor.html', styleUrl: '../../../relatorios/styles/financeiro.css',
})
export class ContaEditor implements OnInit {
  readonly contaId = input<number | null>(null);
  readonly fechado = output<void>(); readonly salvo = output<void>();
  private readonly api = inject(ContaPagarService); private readonly pagamentos = inject(PagamentoService);
  private readonly beneficiariosApi = inject(BeneficiariosService); private readonly eventos = inject(FinanceiroEventos);
  private readonly destroyRef = inject(DestroyRef);
  readonly carregando = signal(false); readonly salvando = signal(false); readonly erro = signal(''); readonly aviso = signal('');
  readonly erroOpcoes = signal(''); readonly carregandoOpcoes = signal(false);
  readonly beneficiarios = signal<Beneficiario[]>([]);
  readonly original = signal<ContaPagarResponse | null>(null); readonly protegido = signal(false);
  readonly pronto = signal(false);
  visivel = true;
  readonly classificacoes = [{ label: 'Despesa', value: 'DESPESA' }, { label: 'Salário', value: 'SALARIO' }];
  readonly form = new FormGroup({
    descricao: new FormControl('', { nonNullable: true }), valor: new FormControl<number | null>(null),
    dataVencimento: new FormControl('', { nonNullable: true }), competencia: new FormControl('', { nonNullable: true }),
    classificacao: new FormControl<ClassificacaoConta>('DESPESA', { nonNullable: true }), beneficiarioId: new FormControl<number | null>(null),
  });
  ngOnInit(): void { this.carregarOpcoes(); if (this.contaId() !== null) this.carregar(); else this.pronto.set(true); }
  carregarOpcoes(): void {
    if (this.carregandoOpcoes()) return;
    this.carregandoOpcoes.set(true); this.erroOpcoes.set('');
    this.beneficiariosApi.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoOpcoes.set(false))).subscribe({
      next: lista => { this.beneficiarios.set(lista); this.preservarPessoa(); },
      error: (e: HttpErrorResponse) => { this.erroOpcoes.set(mensagemApi(e)); this.preservarPessoa(); },
    });
  }
  private preservarPessoa(): void {
    const p = this.original()?.motorista;
    if (p && !this.beneficiarios().some(b => b.id === p.id)) this.beneficiarios.update(lista => [...lista, { ...p, label: `${textoFinanceiro(p.nome)} · vínculo atual · #${p.id}` }]);
  }
  carregar(conflito = ''): void {
    if (this.carregando() || this.contaId() === null) return;
    this.carregando.set(true); this.pronto.set(false); this.erro.set('');
    forkJoin({ conta: this.api.buscar(this.contaId()!), recibos: this.pagamentos.listarPorConta(this.contaId()!) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
        next: ({ conta, recibos }) => {
          this.original.set(conta); this.protegido.set(recibos.length > 0 || conta.status === 'PAGO');
          this.form.enable({ emitEvent: false });
          this.form.reset({ descricao: conta.descricao ?? '', valor: conta.valor, dataVencimento: conta.dataVencimento ?? '', competencia: conta.competencia ?? '', classificacao: conta.classificacao ?? 'DESPESA', beneficiarioId: conta.motorista?.id ?? null });
          if (this.protegido()) { this.form.controls.valor.disable(); this.form.controls.beneficiarioId.disable(); }
          this.preservarPessoa(); this.pronto.set(true);
          if (conflito) this.aviso.set(`${conflito} Os dados atuais foram recarregados após o conflito. Revise o formulário antes de salvar novamente.`);
        },
        error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
      });
  }
  opcoes(): Beneficiario[] { return this.form.controls.classificacao.value === 'SALARIO' ? this.beneficiarios().filter(b => b.tipoPessoa === 'MOTORISTA') : this.beneficiarios(); }
  validacao(): string {
    const v = this.form.getRawValue();
    if (!v.descricao.trim()) return 'Informe a descrição.';
    if (!valorFinanceiroValido(v.valor, true)) return 'Informe um valor positivo com até duas casas decimais.';
    if (!dataFinanceiraValida(v.dataVencimento)) return 'Informe um vencimento válido.';
    if (!mesFinanceiroValido(v.competencia)) return 'Informe uma competência válida.';
    if (!['SALARIO', 'DESPESA'].includes(v.classificacao)) return 'Selecione a classificação.';
    if (v.beneficiarioId !== null && !idFinanceiroValido(v.beneficiarioId)) return 'Selecione um beneficiário válido.';
    if (v.classificacao === 'SALARIO' && !this.opcoes().some(p => p.id === v.beneficiarioId && p.tipoPessoa === 'MOTORISTA')) return 'Salário deve estar vinculado a um motorista.';
    if (v.beneficiarioId !== null && !this.beneficiarios().some(p => p.id === v.beneficiarioId)) return 'Aguarde o carregamento dos beneficiários ou selecione novamente.';
    return '';
  }
  salvar(): void {
    if (!this.pronto() || this.salvando() || this.carregando() || this.carregandoOpcoes()) return;
    const erro = this.validacao(); this.erro.set(erro); if (erro) return;
    const v = this.form.getRawValue(); const anterior = this.original();
    // Campos protegidos são obtidos do registro consultado, nunca do controle alterável pelo cliente.
    const payload: ContaPagarRequest = {
      descricao: v.descricao.trim(), valor: this.protegido() ? anterior!.valor! : v.valor!, dataVencimento: v.dataVencimento,
      competencia: v.competencia, classificacao: v.classificacao,
      motorista: this.protegido() ? (anterior!.motorista ? { id: anterior!.motorista.id } : null) : v.beneficiarioId === null ? null : { id: v.beneficiarioId },
    };
    this.salvando.set(true); this.form.disable({ emitEvent: false });
    const chamada = this.contaId() === null ? this.api.criar(payload) : this.api.atualizarConta(this.contaId()!, payload);
    chamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.salvando.set(false); this.form.enable({ emitEvent: false });
      if (this.protegido()) { this.form.controls.valor.disable({ emitEvent: false }); this.form.controls.beneficiarioId.disable({ emitEvent: false }); }
    })).subscribe({
      next: () => { this.eventos.invalidar(); this.salvo.emit(); },
      error: (e: HttpErrorResponse) => {
        this.erro.set(mensagemApi(e));
        if (e.status === 409 && this.contaId() !== null) this.carregar(mensagemApi(e));
      },
    });
  }
  fechar(): void { if (!this.salvando()) this.fechado.emit(); }
}
