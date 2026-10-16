import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, Observable, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { AlunoService } from '../../../aluno/service/aluno-service';
import { MotoristaService } from '../../../motorista/service/motorista-service';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { avisoFinanceiro, dataFinanceiraValida, diaFinanceiro, emissaoFinanceira, idFinanceiroValido, mesFinanceiroValido, moedaFinanceira, periodoFinanceiroAtual, textoFinanceiro } from '../../../../core/financeiro/financeiro.utils';
import { Acerto, FluxoCaixa, Inadimplencia, MovimentoCaixa, SaldoBase, TipoRelatorio } from '../../models/relatorios.models';
import { baixarPdf, mensagemErroDownload, RelatoriosService } from '../../service/relatorios-service';
import { SaldoBaseEditor } from '../saldo-base/saldo-base';
type Resultado = { tipo: 'inadimplencia'; dados: Inadimplencia } | { tipo: 'fluxo-caixa'; dados: FluxoCaixa } | { tipo: 'acerto-motoristas'; dados: Acerto };
interface Opcao { id: number; label: string; }
@Component({
  selector: 'app-relatorios', standalone: true,
  imports: [TabelaPadrao, ReactiveFormsModule, ButtonModule, SelectModule, InputTextModule, TableModule, TagModule, MessageModule, SaldoBaseEditor],
  templateUrl: './relatorios.html', styleUrl: '../../styles/financeiro.css',
})
export class Relatorios implements OnInit {
  private readonly api = inject(RelatoriosService);
  private readonly alunosApi = inject(AlunoService);
  private readonly motoristasApi = inject(MotoristaService);
  private readonly eventos = inject(FinanceiroEventos);
  private readonly destroyRef = inject(DestroyRef);
  private consulta?: Subscription;
  private sequencia = 0;
  private readonly periodo = periodoFinanceiroAtual();
  readonly tipos = [{ label: 'Inadimplência de alunos', value: 'inadimplencia' }, { label: 'Fluxo de caixa', value: 'fluxo-caixa' }, { label: 'Acerto de motoristas', value: 'acerto-motoristas' }];
  readonly tipo = signal<TipoRelatorio>('inadimplencia');
  readonly resultado = signal<Resultado | null>(null);
  readonly carregando = signal(false); readonly baixando = signal(false);
  readonly erro = signal(''); readonly aviso = signal('');
  readonly erroAlunos = signal(''); readonly erroMotoristas = signal('');
  readonly alunos = signal<Opcao[]>([]); readonly motoristas = signal<Opcao[]>([]);
  readonly carregandoAlunos = signal(false); readonly carregandoMotoristas = signal(false);
  readonly saldo = signal<SaldoBase | null>(null);
  readonly form = new FormGroup({
    tipo: new FormControl<TipoRelatorio>('inadimplencia', { nonNullable: true }),
    alunoId: new FormControl<number | null>(null), motoristaId: new FormControl<number | null>(null),
    vencimentoInicio: new FormControl('', { nonNullable: true }), vencimentoFim: new FormControl('', { nonNullable: true }),
    dataInicio: new FormControl(this.periodo.inicio, { nonNullable: true }), dataFim: new FormControl(this.periodo.fim, { nonNullable: true }),
    mes: new FormControl(this.periodo.mes, { nonNullable: true }),
  });
  readonly moeda = moedaFinanceira; readonly dia = diaFinanceiro; readonly emissao = emissaoFinanceira;
  readonly texto = textoFinanceiro; readonly avisoConta = avisoFinanceiro;
  readonly chaveMovimento = (_: number, movimento: MovimentoCaixa) => `${movimento.tipo}:${movimento.id}`;
  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const tipo = this.form.controls.tipo.value;
      if (tipo !== this.tipo()) { this.tipo.set(tipo); this.saldo.set(null); }
      this.limpar(); this.erro.set(''); this.aviso.set('');
    });
    this.eventos.alterado.pipe(takeUntilDestroyed()).subscribe(() => {
      this.limpar(); this.aviso.set('Dados financeiros alterados. Consulte novamente para atualizar o relatório.');
    });
  }
  ngOnInit(): void { this.carregarAlunos(); this.carregarMotoristas(); }
  carregarAlunos(): void {
    if (this.carregandoAlunos()) return;
    this.carregandoAlunos.set(true); this.erroAlunos.set('');
    this.alunosApi.listarAlunos('TODOS').pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoAlunos.set(false))).subscribe({
      next: lista => this.alunos.set(lista.map(a => ({ id: a.id, label: `${textoFinanceiro(a.nome)} · #${a.id}${a.arquivado ? ' · Arquivado' : ''}` }))),
      error: (e: HttpErrorResponse) => this.erroAlunos.set(mensagemApi(e)),
    });
  }
  carregarMotoristas(): void {
    if (this.carregandoMotoristas()) return;
    this.carregandoMotoristas.set(true); this.erroMotoristas.set('');
    this.motoristasApi.listarMotoristas().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregandoMotoristas.set(false))).subscribe({
      next: lista => this.motoristas.set(lista.map(m => ({ id: m.id, label: `${textoFinanceiro(m.nome)} · #${m.id}` }))),
      error: (e: HttpErrorResponse) => this.erroMotoristas.set(mensagemApi(e)),
    });
  }
  private limpar(): void { this.sequencia++; this.consulta?.unsubscribe(); this.resultado.set(null); }
  filtro() {
    const f = this.form.getRawValue();
    switch (this.tipo()) {
      case 'inadimplencia': return { alunoId: f.alunoId ?? undefined, vencimentoInicio: f.vencimentoInicio || undefined, vencimentoFim: f.vencimentoFim || undefined };
      case 'fluxo-caixa': return { dataInicio: f.dataInicio, dataFim: f.dataFim };
      case 'acerto-motoristas': return { mes: f.mes, motoristaId: f.motoristaId ?? undefined };
    }
  }
  validacao(): string {
    const f = this.form.getRawValue();
    if (this.tipo() === 'inadimplencia') {
      if (f.alunoId !== null && !idFinanceiroValido(f.alunoId)) return 'Selecione um aluno válido.';
      if ((f.vencimentoInicio && !dataFinanceiraValida(f.vencimentoInicio)) || (f.vencimentoFim && !dataFinanceiraValida(f.vencimentoFim))) return 'Informe datas de vencimento válidas.';
      if (f.vencimentoInicio && f.vencimentoFim && f.vencimentoInicio > f.vencimentoFim) return 'O vencimento inicial deve ser anterior ou igual ao final.';
    } else if (this.tipo() === 'fluxo-caixa') {
      if (!dataFinanceiraValida(f.dataInicio) || !dataFinanceiraValida(f.dataFim)) return 'Informe as datas inicial e final.';
      if (f.dataInicio > f.dataFim) return 'A data inicial deve ser anterior ou igual à final.';
      if (!this.saldo()) return 'Configure ou atualize o saldo base antes de consultar o fluxo.';
      if (f.dataInicio < this.saldo()!.dataReferencia) return 'A data inicial não pode ser anterior à data do saldo base.';
    } else {
      if (!mesFinanceiroValido(f.mes)) return 'Informe uma competência válida no formato mês/ano.';
      if (f.motoristaId !== null && !idFinanceiroValido(f.motoristaId)) return 'Selecione um motorista válido.';
    }
    return '';
  }
  consultar(): void {
    if (this.carregando() || this.baixando()) return;
    const erro = this.validacao(); this.erro.set(erro); if (erro) return;
    this.limpar(); const seq = this.sequencia; const tipo = this.tipo(); const f = this.form.getRawValue();
    let chamada: Observable<Resultado>;
    // Cada ramo mantém seu contrato tipado; o resultado carrega o discriminante usado no template.
    if (tipo === 'inadimplencia') chamada = this.api.inadimplencia({ alunoId: f.alunoId ?? undefined, vencimentoInicio: f.vencimentoInicio || undefined, vencimentoFim: f.vencimentoFim || undefined }).pipe(map(r => ({ tipo: 'inadimplencia' as const, dados: r })));
    else if (tipo === 'fluxo-caixa') chamada = this.api.fluxo({ dataInicio: f.dataInicio, dataFim: f.dataFim }).pipe(map(r => ({ tipo: 'fluxo-caixa' as const, dados: r })));
    else chamada = this.api.acerto({ mes: f.mes, motoristaId: f.motoristaId ?? undefined }).pipe(map(r => ({ tipo: 'acerto-motoristas' as const, dados: r })));
    this.carregando.set(true); this.aviso.set(''); this.form.disable({ emitEvent: false });
    this.consulta = chamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.carregando.set(false); this.form.enable({ emitEvent: false }); })).subscribe({
      next: r => { if (seq === this.sequencia) { this.resultado.set(r); this.completarOpcoes(r); } },
      error: (e: HttpErrorResponse) => { if (seq === this.sequencia) this.erro.set(mensagemApi(e)); },
    });
  }
  private completarOpcoes(r: Resultado): void {
    if (r.tipo === 'inadimplencia') {
      const id = this.form.controls.alunoId.value; const aluno = r.dados.alunos.find(a => a.alunoId === id);
      if (aluno && !this.alunos().some(a => a.id === id)) this.alunos.update(lista => [...lista, { id: aluno.alunoId, label: `${textoFinanceiro(aluno.nome)} · #${aluno.alunoId}${aluno.arquivado ? ' · Arquivado' : ''}` }]);
    } else if (r.tipo === 'acerto-motoristas') {
      const id = this.form.controls.motoristaId.value; const m = r.dados.motoristas.find(a => a.motoristaId === id);
      if (m && !this.motoristas().some(a => a.id === id)) this.motoristas.update(lista => [...lista, { id: m.motoristaId, label: `${textoFinanceiro(m.nome)} · #${m.motoristaId}` }]);
    } else this.saldo.set(r.dados.saldoBase);
  }
  baixar(): void {
    if (this.carregando() || this.baixando()) return;
    const erro = this.validacao(); this.erro.set(erro); if (erro) return;
    const seq = this.sequencia; this.baixando.set(true); this.form.disable({ emitEvent: false });
    this.api.pdf(this.tipo(), this.filtro()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.baixando.set(false); this.form.enable({ emitEvent: false }); })).subscribe({
      next: r => { try { baixarPdf(r); } catch { this.erro.set('O servidor retornou um arquivo vazio ou não foi possível iniciar o download.'); } },
      error: async (e: unknown) => { const texto = await mensagemErroDownload(e); if (!this.destroyRef.destroyed && seq === this.sequencia) this.erro.set(texto); },
    });
  }
  saldoCarregado(b: SaldoBase | null): void { this.saldo.set(b); this.limpar(); }
  saldoSalvo(): void { this.aviso.set('Saldo base salvo. Consulte novamente o fluxo.'); }
}
