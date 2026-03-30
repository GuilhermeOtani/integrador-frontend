import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FaculdadeService } from '../faculdade-service';

@Component({
  selector: 'app-faculdade-cadastro',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './faculdade-cadastro.html',
  styleUrl: './faculdade-cadastro.css',
})
export class FaculdadeCadastro {

  @Input() faculdade: any = {}; 
  
  @Output() aoSalvar = new EventEmitter<void>(); 
  @Output() aoCancelar = new EventEmitter<void>(); 

  private faculdadeService = inject(FaculdadeService);
  private messageService = inject(MessageService);
  
  submitted: boolean = false;

  confirmarSalvar() {
    this.submitted = true;
    if (this.faculdade.nome?.trim()) {
        if (this.faculdade.id) {
            this.atualizarFaculdadeExistente();
        } else {
            this.cadastrarNovaFaculdade();
        }
    }
  }

  atualizarFaculdadeExistente() {
    this.faculdadeService.EditarFaculdades(this.faculdade).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Faculdade Atualizada!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao atualizar:", err)
    });
  }

  cadastrarNovaFaculdade() {
    this.faculdadeService.CadastroFaculdades(this.faculdade).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Faculdade Cadastrada!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao cadastrar:", err)
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}


