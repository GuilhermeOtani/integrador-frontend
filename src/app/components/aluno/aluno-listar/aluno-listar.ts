import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { AlunoService } from '../aluno-service';
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { label } from '@primeuix/themes/aura/metergroup';

@Component({
  standalone: true,
  selector: 'app-aluno-listar',
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    FileUploadModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    RadioButtonModule,
    RatingModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    FormsModule,
  ],
  providers: [AlunoService, MessageService, ConfirmationService],
  templateUrl: './aluno-listar.html',
  styleUrl: './aluno-listar.css',
})
export class AlunoListar {
  private alunoService = inject(AlunoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  alunoDialog: boolean = false;
  alunos!: any;
  aluno!: any;
  selectedAlunos!: any | null;
  submitted: boolean = false;
  statuses!: any[];
  cols!: Column[];
  exportColumns!: ExportColumn[];
  @ViewChild('dt') dt!: Table;

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.carregarAlunos();
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Aluno ID' },
      { field: 'nome', header: 'Nome' },
      { field: 'cpfCnpj', header: 'CPF/CNPJ' },
      { field: 'telefone', header: 'Telefone' },
      { field: 'matricula', header: 'Matrícula' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  openNew() {
    this.aluno = {};
    this.submitted = false;
    this.alunoDialog = true;
  }

  carregarAlunos() {
    this.alunoService.listarAlunos().subscribe({
      next: (data) => {
      this.alunos = data;
      },
      error:  (err) => console.error('Erro ao carregar alunos:', err),
    });
  }

  editAluno(aluno: any) {
    this.aluno = { ...aluno };
    this.alunoDialog = true;
  }

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
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Aluno Atualizado!', life: 3000 });
                this.finalizarAcao();
            },
            error: (err) => console.error("Erro ao atualizar:", err)
        });
    }

    cadastrarNovoAluno() {
        this.alunoService.CadastroAlunos(this.aluno).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Aluno Cadastrado!', life: 3000 });
                this.finalizarAcao();
            },
            error: (err) => console.error("Erro ao cadastrar:", err)
        });
    }
    finalizarAcao() {
        this.alunoDialog = false;
        this.aluno = {};
        this.carregarAlunos(); // Recarrega a tabela com os dados atualizados do banco
    }

  deleteSelectedAlunos() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected alunos?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        variant: 'text',
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Yes',
      },
      accept: () => {
        this.alunos = this.alunos.filter((val: any) => !this.selectedAlunos?.includes(val));
        this.selectedAlunos = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Alunos Deleted',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.alunoDialog = false;
    this.submitted = false;
  }

  deleteAluno(aluno: any) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este aluno ' + aluno.nome + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {severity: 'danger', label: 'Sim'},
      rejectButtonProps: {label: 'Não', severity: 'secondary', variant: 'text'},
      accept: () => {
        this.alunoService.ExcluirAlunos(aluno.id).subscribe({
          next: () => {
        this.messageService.add({severity: 'success', summary: 'Successful', detail: 'Aluno Deleted', life: 3000 });
        this.carregarAlunos();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to delete aluno', life: 3000 });
      }
    });
  }
});
    }
  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.alunos.length; i++) {
      if (this.alunos[i].id === id) {
        index = i;
        break;
      }
    }

    return index;
  }

  createId(): string {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  getSeverity(status: string) {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default:
        return 'info';
    }
  }
}
export interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

export interface ExportColumn {
  title: string;
  dataKey: string;
}
