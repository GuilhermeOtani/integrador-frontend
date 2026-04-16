import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { OnibusService } from '../onibus-service';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { event } from '@primeuix/themes/aura/timeline';

@Component({
  selector: 'app-onibus-cadastro',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, FileUploadModule],
  templateUrl: './onibus-cadastro.html',
  styleUrl: './onibus-cadastro.css',
})
export class OnibusCadastro {

  @Input() onibus: any = {}; 
  
  @Output() aoSalvar = new EventEmitter<void>(); 
  @Output() aoCancelar = new EventEmitter<void>(); 

  private onibusService = inject(OnibusService);
  private messageService = inject(MessageService);
  
  submitted: boolean = false;

  listaStatus = [
        { label: 'Operando', value: 'OPERANDO' },
        { label: 'Em Manutenção', value: 'MANUTENCAO' },
        { label: 'Quebrado', value: 'QUEBRADO' },
        { label: 'Inativo', value: 'INATIVO' }
    ];

    aoSelecionarFoto(event: any) {
      const file = event.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.onibus.fotoUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }


  confirmarSalvar() {
    this.submitted = true;
    if (this.onibus.numeroIdentificacao?.trim()) {
        if (this.onibus.id) {
            this.atualizarOnibusExistente();
        } else {
            this.cadastrarNovoOnibus();
        }
    }
  }

  atualizarOnibusExistente() {
    this.onibusService.EditarOnibus(this.onibus).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Onibus Atualizada!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao atualizar:", err)
    });
  }

  cadastrarNovoOnibus() {
    this.onibusService.CadastroOnibus(this.onibus).subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Onibus Cadastrado!', life: 3000 });
            this.aoSalvar.emit(); 
        },
        error: (err) => console.error("Erro ao cadastrar:", err)
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}


