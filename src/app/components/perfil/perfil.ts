import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { mensagemApi } from '../../core/auth/api-error';
import { MeResponse, StatusMatricula } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, MessageModule, ProgressSpinnerModule, TagModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);

  readonly perfil = signal<MeResponse | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.auth
      .carregarPerfil()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (perfil) => this.perfil.set(perfil),
        error: (error: HttpErrorResponse) => this.erro.set(mensagemApi(error)),
      });
  }

  rotuloPapel(papel: string): string {
    return papel === 'ADMIN' ? 'Administrador' : papel === 'ALUNO' ? 'Aluno' : 'Motorista';
  }

  rotuloStatus(status: StatusMatricula | null): string {
    if (status === 'ATIV0') return 'Ativo';
    if (status === 'INATIV0') return 'Inativo';
    if (status === 'PENDENTE') return 'Pendente';
    return 'Não informado';
  }
}
