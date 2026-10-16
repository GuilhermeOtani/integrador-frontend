import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartOptions } from 'chart.js';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { DashboardService } from '../../service/dashboard-service';
import { ConsultaDashboard } from '../../utils/consulta-dashboard';
import { geradoEm, mesValido, moeda, rotuloSituacao, severidadeSituacao } from '../../utils/dashboard.utils';
@Component({
  selector: 'app-dashboard-admin', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, DialogModule, ChartModule, InputTextModule, MessageModule, SkeletonModule, TagModule],
  templateUrl: './dashboard-admin.html', styleUrls: ['../../styles/dashboard.css', '../../styles/dialog-dashboard.css', './dashboard-admin.css'],
})
export class DashboardAdmin implements OnInit {
  readonly pendenciasTipo = signal<'receber' | 'pagar'>('receber');
  readonly tabelaVisivel = signal(false);
  readonly detalheOperacao = signal<'alunos' | 'frota' | 'viagens' | 'manutencao' | null>(null);
  readonly resumoOperacao = computed(() => {
    const dados = this.consulta.dados()?.operacao;
    if (!dados) return null;
    switch (this.detalheOperacao()) {
      case 'alunos': return { titulo: 'Alunos', icone: 'pi pi-users', total: dados.alunos.total, legenda: 'Alunos cadastrados', rota: '/alunos', acao: 'Consultar alunos', itens: [
        { label: 'Ativos', valor: dados.alunos.ativos, icone: 'pi pi-check-circle', tom: '' },
        { label: 'Inativos', valor: dados.alunos.inativos, icone: 'pi pi-minus-circle', tom: 'vermelho' },
        { label: 'Pendentes', valor: dados.alunos.pendentes, icone: 'pi pi-clock', tom: 'laranja' },
        { label: 'Não informado', valor: dados.alunos.semStatus, icone: 'pi pi-question-circle', tom: 'azul' },
      ] };
      case 'frota': return { titulo: 'Frota', icone: 'pi pi-truck', total: dados.onibus.total, legenda: 'Ônibus cadastrados', rota: '/onibus', acao: 'Consultar ônibus', itens: [
        { label: 'Operando', valor: dados.onibus.operando, icone: 'pi pi-check-circle', tom: '' },
        { label: 'Manutenção', valor: dados.onibus.manutencao, icone: 'pi pi-wrench', tom: 'laranja' },
        { label: 'Quebrados', valor: dados.onibus.quebrado, icone: 'pi pi-exclamation-circle', tom: 'vermelho' },
        { label: 'Inativos', valor: dados.onibus.inativo, icone: 'pi pi-pause-circle', tom: 'azul' },
        { label: 'Não informado', valor: dados.onibus.semStatus, icone: 'pi pi-question-circle', tom: 'azul' },
      ] };
      case 'viagens': return { titulo: 'Viagens', icone: 'pi pi-calendar', total: dados.viagensHoje, legenda: 'Viagens de hoje', rota: '/grades', acao: 'Consultar grades', itens: [
        { label: 'Viagens hoje', valor: dados.viagensHoje, icone: 'pi pi-calendar', tom: '' },
        { label: 'Sem programação', valor: dados.viagensSemProgramacao, icone: 'pi pi-clock', tom: 'laranja' },
      ] };
      case 'manutencao': return { titulo: 'Manutenção', icone: 'pi pi-wrench', total: dados.chamados.abertos + dados.chamados.emAndamento, legenda: 'Chamados pendentes', rota: '/manutencao', acao: 'Consultar manutenção', itens: [
        { label: 'Chamados abertos', valor: dados.chamados.abertos, icone: 'pi pi-inbox', tom: 'azul' },
        { label: 'Em andamento', valor: dados.chamados.emAndamento, icone: 'pi pi-spinner', tom: 'laranja' },
        { label: 'Prioridade alta pendente', valor: dados.chamados.prioridadeAlta, icone: 'pi pi-exclamation-circle', tom: 'vermelho' },
      ] };
      default: return null;
    }
  });
  readonly pendencias = computed(() => {
    const financeiro = this.consulta.dados()?.financeiro;
    return (this.pendenciasTipo() === 'receber' ? financeiro?.pendenciasReceber : financeiro?.pendenciasPagar) ?? [];
  });
  private readonly service = inject(DashboardService);
  private readonly eventos = inject(FinanceiroEventos);
  readonly mes = new FormControl('', { nonNullable: true, validators: control => mesValido(control.value) ? null : { mes: true } });
  readonly consulta = new ConsultaDashboard(mes => this.service.admin(mes), dados => this.mes.setValue(dados.mes, { emitEvent: false }));
  readonly moeda = moeda;
  readonly geradoEm = geradoEm;
  readonly rotulo = rotuloSituacao;
  readonly severidade = severidadeSituacao;
  readonly grafico = computed(() => {
    const serie = this.consulta.dados()?.financeiro.serieMensal ?? [];
    return { labels: serie.map(m => m.mes), datasets: [
        { label: 'Recebido', data: serie.map(m => m.recebido), backgroundColor: '#16a34a' },
        { label: 'Pago', data: serie.map(m => m.pago), backgroundColor: '#dc2626' },
      ] };
  });
  readonly opcoesGrafico: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b' } }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${moeda(context.parsed.y)}` } } },
    scales: { y: { beginAtZero: true, ticks: { color: '#64748b', callback: valor => moeda(Number(valor)) } }, x: { ticks: { color: '#64748b' } } },
  };
  constructor() { this.eventos.alterado.pipe(takeUntilDestroyed()).subscribe(() => this.carregar()); }
  ngOnInit(): void { this.consulta.carregar(); }
  alterarMes(valor: string): void {
    this.mes.setValue(valor);
    this.mes.markAsDirty();
    if (this.mes.valid)
      this.consulta.carregar(valor);
  }
  carregar(): void {
    if (!this.mes.value && !this.mes.dirty)
      this.consulta.carregar();
    else if (this.mes.valid)
      this.consulta.carregar(this.mes.value);
    else
      this.mes.markAsTouched();
  }
}
