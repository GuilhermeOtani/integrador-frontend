import { Component, EventEmitter, Input, Output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { MotoristaService } from '../motorista-service';
import { SelectModule } from 'primeng/select';
import { InputMask, InputMaskModule } from 'primeng/inputmask';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';

@Component({
  standalone: true,
  selector: 'app-motorista-cadastro',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, InputMaskModule, InputNumberModule],
  templateUrl: './motorista-cadastro.html',
  styleUrl: './motorista-cadastro.css'
})
export class MotoristaCadastro {
  @Input() motorista: any = {}; 
  @Input() onibus: any[] = [];
  @Output() aoSalvar = new EventEmitter<void>(); 
  @Output() aoCancelar = new EventEmitter<void>(); 

  private motoristaService = inject(MotoristaService);
  private messageService = inject(MessageService);
  
  submitted: boolean = false;

  confirmarSalvar() {
    this.submitted = true;
    if (this.motorista.nome?.trim()) {
        if (this.motorista.id) {
            this.atualizarMotoristaExistente();
        } else {
            this.cadastrarNovoMotorista();
        }
    }
  }

  atualizarMotoristaExistente() {
    this.motoristaService.EditarMotoristas(this.motorista).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Motorista Atualizado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao atualizar:", err)
    });
  }

  cadastrarNovoMotorista() {
    this.motoristaService.CadastroMotoristas(this.motorista).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Motorista Cadastrado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao cadastrar:", err)
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}