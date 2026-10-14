import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AgendaTransporte } from '../agenda-transporte/agenda-transporte';
import { PagamentoMatricula } from '../../../conta-receber/components/pagamento-matricula/pagamento-matricula';
import { DashboardService } from '../../service/dashboard-service';
import { ConsultaDashboard } from '../../utils/consulta-dashboard';
import { geradoEm, moeda, prazoCobranca, severidadeSituacao } from '../../utils/dashboard.utils';
@Component({
  selector: 'app-dashboard-aluno', standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, DialogModule, MessageModule, SkeletonModule, TagModule, AgendaTransporte, PagamentoMatricula],
  templateUrl: './dashboard-aluno.html', styleUrls: ['../../styles/dashboard.css', '../../styles/dialog-dashboard.css'],
})
export class DashboardAluno implements OnInit {
  private readonly service = inject(DashboardService);
  readonly pagamento = viewChild.required(PagamentoMatricula);
  readonly pagamentoRegistrado = signal(false);
  readonly viagemSelecionada = signal<string | null>(null);
  readonly resumoVisivel = signal(false);
  readonly consulta = new ConsultaDashboard(() => this.service.aluno(), () => this.pagamentoRegistrado.set(false));
  readonly moeda = moeda;
  readonly geradoEm = geradoEm;
  readonly prazo = prazoCobranca;
  readonly severidade = severidadeSituacao;
  ngOnInit(): void { this.carregar(); }
  carregar(): void { this.consulta.carregar(); }
  aposPagamento(): void { this.pagamentoRegistrado.set(true); this.carregar(); }
  situacaoMatricula(valor: string | null): string {
    return valor === 'ATIV0' ? 'Ativa' : valor === 'INATIV0' ? 'Inativa' : valor === 'PENDENTE' ? 'Pendente' : 'Não informado';
  }
}
