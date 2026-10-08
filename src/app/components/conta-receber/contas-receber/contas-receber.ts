import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { finalize } from 'rxjs';
import { mensagemApi } from '../../../core/auth/api-error';
import { ContaReceberService } from '../conta-receber-service';
import { ContaReceber, StatusFinanceiro } from '../model/conta-receber';

@Component({
  selector: 'app-contas-receber',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    ToolbarModule,
  ],
  templateUrl: './contas-receber.html',
  styleUrl: './contas-receber.css',
})
export class ContasReceber implements OnInit {
  private readonly contaReceberService = inject(ContaReceberService);

  readonly contas = signal<ContaReceber[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly mostrarPagas = signal(false);

  readonly contasEmAberto = computed(() =>
    this.contas().filter((conta) => conta.status !== 'PAGO'),
  );
  readonly contasPagas = computed(() =>
    this.contas().filter((conta) => conta.status === 'PAGO'),
  );
  readonly contasVisiveis = computed(() =>
    this.mostrarPagas() ? this.contasPagas() : this.contasEmAberto(),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.contaReceberService
      .listarTodas()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (contas) => this.contas.set(contas),
        error: (error: HttpErrorResponse) => this.erro.set(mensagemApi(error)),
      });
  }

  selecionarHistorico(mostrar: boolean): void {
    this.mostrarPagas.set(mostrar);
  }

  getSeverity(status: StatusFinanceiro): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'ATRASADO') return 'danger';
    return 'warn';
  }

  rotuloStatus(status: StatusFinanceiro): string {
    if (status === 'PAGO') return 'Pago';
    if (status === 'ATRASADO') return 'Atrasado';
    return 'Pendente';
  }
}
