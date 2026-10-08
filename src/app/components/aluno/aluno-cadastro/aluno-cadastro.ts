import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AlunoService } from '../aluno-service';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { mensagemApi } from '../../../core/auth/api-error';

@Component({
  standalone: true,
  selector: 'app-aluno-cadastro',
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    InputMaskModule,
    InputNumberModule,
  ],
  templateUrl: './aluno-cadastro.html',
  styleUrl: './aluno-cadastro.css',
})
export class AlunoCadastro {
  @Input() aluno: any = {};
  @Input() faculdades: any[] = [];
  @Output() aoSalvar = new EventEmitter<void>();
  @Output() aoCancelar = new EventEmitter<void>();

  private readonly alunoService = inject(AlunoService);
  private readonly messageService = inject(MessageService);
  
  submitted = false;

  confirmarSalvar(): void {
    this.submitted = true;
    const mensalidade = Number(this.aluno.mensalidade);
    const formularioValido =
      this.aluno.nome?.trim() &&
      this.aluno.matricula?.trim() &&
      Number.isFinite(mensalidade) &&
      mensalidade >= 0.01;

    if (!formularioValido) return;

    this.aluno.nome = this.aluno.nome.trim();
    this.aluno.matricula = this.aluno.matricula.trim();
    this.aluno.mensalidade = Math.round(mensalidade * 100) / 100;

    if (this.aluno.id) {
      this.atualizarAlunoExistente();
    } else {
      this.cadastrarNovoAluno();
    }
  }

  atualizarAlunoExistente(): void {
    this.alunoService.EditarAlunos(this.aluno).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Aluno atualizado!',
          life: 3000,
        });
        this.aoSalvar.emit();
      },
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  cadastrarNovoAluno(): void {
    this.alunoService.CadastroAlunos(this.aluno).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Aluno cadastrado!',
          life: 3000,
        });
        this.aoSalvar.emit();
      },
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  private mostrarErro(error: HttpErrorResponse): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Não foi possível salvar',
      detail: mensagemApi(error),
      life: 5000,
    });
  }

  cancelar(): void {
    this.aoCancelar.emit();
  }
}
