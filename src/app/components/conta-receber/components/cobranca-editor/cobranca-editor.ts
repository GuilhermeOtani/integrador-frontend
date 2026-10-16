import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber, ContaReceberRequest } from '../../models/conta-receber';
import { AlunoService } from '../../../aluno/service/aluno-service';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { dataFinanceiraValida, idFinanceiroValido, mesFinanceiroValido, valorFinanceiroValido } from '../../../../core/financeiro/financeiro.utils';
import { cobrancaProtegida } from '../../utils/conta-receber.utils';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
@Component({
  selector: 'app-cobranca-editor', standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, SelectModule, MessageModule],
  templateUrl: './cobranca-editor.html', styleUrl: '../../../relatorios/styles/financeiro.css',
})
export class CobrancaEditor implements OnInit {
  readonly contaId = input<number | null>(null); readonly fechado = output<void>(); readonly salvo = output<void>();
  private readonly api = inject(ContaReceberService); private readonly alunosApi = inject(AlunoService);
  private readonly eventos = inject(FinanceiroEventos); private readonly destroyRef = inject(DestroyRef);
  readonly carregando = signal(false); readonly salvando = signal(false); readonly pronto = signal(false);
  readonly carregandoAlunos = signal(false); readonly erroAlunos = signal(''); readonly erro = signal(''); readonly aviso = signal('');
  readonly alunos = signal<{ id: number; label: string }[]>([]); readonly original = signal<ContaReceber | null>(null); readonly protegido = signal(false);
  visivel = true;
  readonly form = new FormGroup({ descricao: new FormControl('', { nonNullable: true }), valor: new FormControl<number | null>(null),
    dataVencimento: new FormControl('', { nonNullable: true }), competencia: new FormControl('', { nonNullable: true }), alunoId: new FormControl<number | null>(null) });
  ngOnInit(): void { this.carregarAlunos(); if (this.contaId() !== null) this.carregar(); else this.pronto.set(true); }
  carregarAlunos(): void {
    if (this.carregandoAlunos()) return;
    this.carregandoAlunos.set(true); this.erroAlunos.set('');
    this.alunosApi.listarAlunos('NAO_ARQUIVADOS').pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoAlunos.set(false))).subscribe({
      next: lista => { this.alunos.set(lista.filter(a => !a.arquivado && idFinanceiroValido(a.id)).map(a => ({ id: a.id!, label: `${a.nome} · #${a.id}` }))); this.preservarAluno(); },
      error: (e: HttpErrorResponse) => { this.erroAlunos.set(mensagemApi(e)); this.preservarAluno(); },
    });
  }
  private preservarAluno(): void {
    const c = this.original();
    if (c && !this.alunos().some(a => a.id === c.alunoId)) this.alunos.update(lista => [...lista, { id: c.alunoId, label: `${c.nomeAluno ?? 'Aluno'} · vínculo atual · #${c.alunoId}` }]);
  }
  carregar(conflito = ''): void {
    if (this.carregando() || this.contaId() === null) return;
    this.carregando.set(true); this.pronto.set(false); this.erro.set('');
    this.api.buscar(this.contaId()!).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: c => {
        this.original.set(c); this.protegido.set(cobrancaProtegida(c)); this.form.enable({ emitEvent: false });
        this.form.reset({ descricao: c.descricao ?? '', valor: c.valor, dataVencimento: c.dataVencimento ?? '', competencia: c.competencia ?? '', alunoId: c.alunoId });
        this.restaurarProtecao(); this.preservarAluno(); this.pronto.set(true);
        if (conflito) this.aviso.set(`${conflito} Os dados foram recarregados. Revise antes de salvar novamente.`);
      }, error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
    });
  }
  private restaurarProtecao(): void { if (this.protegido()) { this.form.controls.valor.disable({ emitEvent: false }); this.form.controls.alunoId.disable({ emitEvent: false }); } }
  validacao(): string {
    const v = this.form.getRawValue();
    if (!v.descricao.trim()) return 'Informe a descrição.';
    if (!this.protegido() && !valorFinanceiroValido(v.valor, true)) return 'Informe um valor positivo com até duas casas decimais.';
    if (!dataFinanceiraValida(v.dataVencimento)) return 'Informe um vencimento válido.';
    if (!mesFinanceiroValido(v.competencia)) return 'Informe a competência (ano e mês).';
    if (!idFinanceiroValido(v.alunoId) || !this.alunos().some(a => a.id === v.alunoId)) return 'Selecione um aluno válido.';
    return '';
  }
  salvar(): void {
    if (!this.pronto() || this.salvando() || this.carregando() || this.carregandoAlunos()) return;
    const erro = this.validacao(); this.erro.set(erro); if (erro) return;
    const v = this.form.getRawValue(), original = this.original();
    const dados: ContaReceberRequest = { descricao: v.descricao.trim(), valor: this.protegido() ? original!.valor! : v.valor!,
      dataVencimento: v.dataVencimento, competencia: v.competencia, aluno: { id: this.protegido() ? original!.alunoId : v.alunoId! } };
    this.salvando.set(true); this.form.disable({ emitEvent: false });
    const chamada = this.contaId() === null ? this.api.criar(dados) : this.api.atualizar(this.contaId()!, dados);
    chamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.salvando.set(false); this.form.enable({ emitEvent: false }); this.restaurarProtecao(); })).subscribe({
      next: () => { this.eventos.invalidar(); this.salvo.emit(); },
      error: (e: HttpErrorResponse) => { this.erro.set(mensagemApi(e)); if (e.status === 409 && this.contaId() !== null) this.carregar(mensagemApi(e)); },
    });
  }
  fechar(): void { if (!this.salvando()) this.fechado.emit(); }
}
