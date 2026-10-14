import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber, StatusFinanceiro } from '../../models/conta-receber';
import { PagamentoMatricula } from '../pagamento-matricula/pagamento-matricula';
@Component({
  selector: 'app-minhas-matriculas',
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
    PagamentoMatricula,
  ],
  templateUrl: './minhas-matriculas.html',
  styleUrl: './minhas-matriculas.css',
})
export class MinhasMatriculas implements OnInit {
  private readonly contaReceberService = inject(ContaReceberService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pagamento = viewChild.required(PagamentoMatricula);
  readonly contas = signal<ContaReceber[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly mostrarPagas = signal(false);
  readonly contasEmAberto = computed(() => this.contas().filter((c) => c.status !== 'PAGO'));
  readonly contasPagas = computed(() => this.contas().filter((c) => c.status === 'PAGO'));
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
      .listarMinhas()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (contas) => this.contas.set(contas),
        error: (e: HttpErrorResponse) => this.erro.set(mensagemApi(e)),
      });
  }
  abrirPagamento(conta: ContaReceber): void {
    this.pagamento().abrirPagamento(conta);
  }
  visualizarRecibo(conta: ContaReceber): void {
    this.pagamento().visualizarRecibo(conta);
  }
  selecionarHistorico(mostrar: boolean): void {
    this.mostrarPagas.set(mostrar);
  }
  getSeverity(status: StatusFinanceiro): 'success' | 'warn' | 'danger' {
    return status === 'PAGO' ? 'success' : status === 'ATRASADO' ? 'danger' : 'warn';
  }
  rotuloStatus(status: StatusFinanceiro): string {
    return status === 'PAGO' ? 'Pago' : status === 'ATRASADO' ? 'Atrasado' : 'Pendente';
  }
}
