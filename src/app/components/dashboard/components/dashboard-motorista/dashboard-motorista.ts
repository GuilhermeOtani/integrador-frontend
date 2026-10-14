import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AgendaTransporte } from '../agenda-transporte/agenda-transporte';
import { DashboardService } from '../../service/dashboard-service';
import { ConsultaDashboard } from '../../utils/consulta-dashboard';
import { geradoEm } from '../../utils/dashboard.utils';
@Component({
  selector: 'app-dashboard-motorista', standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, MessageModule, SkeletonModule, AgendaTransporte],
  templateUrl: './dashboard-motorista.html', styleUrl: '../../styles/dashboard.css',
})
export class DashboardMotorista implements OnInit {
  readonly viagemSelecionada = signal<string | null>(null);
  private readonly service = inject(DashboardService);
  readonly consulta = new ConsultaDashboard(() => this.service.motorista());
  readonly geradoEm = geradoEm;
  ngOnInit(): void { this.carregar(); }
  carregar(): void { this.consulta.carregar(); }
}
