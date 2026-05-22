import { Component, EventEmitter, Input, Output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AlunoService } from '../aluno-service';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  standalone: true,
  selector: 'app-aluno-cadastro',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, InputMaskModule],
  templateUrl: './aluno-cadastro.html',
  styleUrl: './aluno-cadastro.css'
})
export class AlunoCadastro {
  @Input() aluno: any = {}; 
  @Input() faculdades: any[] = [];
  @Output() aoSalvar = new EventEmitter<void>(); 
  @Output() aoCancelar = new EventEmitter<void>(); 

  private alunoService = inject(AlunoService);
  private messageService = inject(MessageService);
  
  submitted: boolean = false;

  confirmarSalvar() {
    this.submitted = true;
    if (this.aluno.nome?.trim()) {
        if (this.aluno.id) {
            this.atualizarAlunoExistente();
        } else {
            this.cadastrarNovoAluno();
        }
    }
  }

  atualizarAlunoExistente() {
    this.alunoService.EditarAlunos(this.aluno).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Aluno Atualizado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao atualizar:", err)
    });
  }

  cadastrarNovoAluno() {
    this.alunoService.CadastroAlunos(this.aluno).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Aluno Cadastrado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao cadastrar:", err)
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}