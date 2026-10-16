import { TabelaPadrao } from '../../../../shared/ui/tabelas/tabela-padrao';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import Viagem from '../../models/viagem';
import { ViagemService } from '../../service/viagem-service';

@Component({
  selector: 'app-minhas-viagens',
  standalone: true,
  imports: [TabelaPadrao, CommonModule, MessageModule, ProgressSpinnerModule, TableModule, TagModule],
  templateUrl: './minhas-viagens.html',
  styleUrl: './minhas-viagens.css',
})
export class MinhasViagens implements OnInit {
  private readonly viagemService = inject(ViagemService);

  readonly viagens = signal<Viagem[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.viagemService
      .listarMinhas()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (viagens) => this.viagens.set(viagens),
        error: (error: HttpErrorResponse) => this.erro.set(mensagemApi(error)),
      });
  }
}
