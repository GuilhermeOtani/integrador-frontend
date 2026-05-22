import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
// Importe o seu service aqui. Ajuste o caminho conforme o nome do seu arquivo
import { PontoEmbarqueService } from '../ponto-embarque-service'; 

@Component({
  selector: 'app-ponto-embarque-cadastro',
  standalone: true, 
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './ponto-embarque-cadastro.html',
  styleUrl: './ponto-embarque-cadastro.css',
})
export class PontoEmbarqueCadastro {

  @Input() pontoEmbarque: any = {}; 
  
  @Output() aoSalvar = new EventEmitter<void>(); 
  @Output() aoCancelar = new EventEmitter<void>(); 

  private pontoEmbarqueService = inject(PontoEmbarqueService);
  private messageService = inject(MessageService);
  
  submitted: boolean = false;

  confirmarSalvar() {
    this.submitted = true;
    
    if (this.pontoEmbarque.descricao?.trim() && this.pontoEmbarque.ordemParada) {
        if (this.pontoEmbarque.id) {
            this.atualizarPontoEmbarqueExistente();
        } else {
            this.cadastrarNovoPontoEmbarque();
        }
    }
  }

  atualizarPontoEmbarqueExistente() {
    this.pontoEmbarqueService.EditarPontoEmbarque(this.pontoEmbarque).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ponto de Embarque Atualizado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao atualizar:", err)
    });
  }

  cadastrarNovoPontoEmbarque() {
    this.pontoEmbarqueService.CadastroPontoEmbarque(this.pontoEmbarque).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ponto de Embarque Cadastrado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao cadastrar:", err)
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}