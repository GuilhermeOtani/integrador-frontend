import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { Table, TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PontoEmbarqueService } from '../ponto-embarque-service'; // Ajuste o caminho do seu service
import { PontoEmbarque } from '../model/ponto-embarque'; // Ajuste o caminho do seu model
import { PontoEmbarqueCadastro } from '../ponto-embarque-cadastro/ponto-embarque-cadastro';

@Component({
  standalone: true,
  selector: 'app-ponto-embarque-listar',
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
    PontoEmbarqueCadastro
  ],
  providers: [PontoEmbarqueService, MessageService, ConfirmationService],
  templateUrl: './ponto-embarque-listar.html',
  styleUrl: './ponto-embarque-listar.css',
})
export class PontoEmbarqueListar {

  private pontoEmbarqueService = inject(PontoEmbarqueService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  
  pontoEmbarqueDialog: boolean = false;
  pontosEmbarque: PontoEmbarque[] = []; 
  pontoEmbarque: PontoEmbarque = {} as PontoEmbarque; 
  selectedPontosEmbarque: PontoEmbarque[] | null = null;
  submitted: boolean = false;
  statuses!: any[];
  cols!: Column[];
  exportColumns!: ExportColumn[];
  
  @ViewChild('dt') dt!: Table;

  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarPontoEmbarque() {
      this.pontoEmbarqueDialog = false;
      this.pontoEmbarque = {} as PontoEmbarque;
      this.carregarPontosEmbarque(); 
  }

  ngOnInit() {
    this.carregarPontosEmbarque();
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Ponto Embarque ID' },
      { field: 'descricao', header: 'Descrição' },
      { field: 'ordemParada', header: 'Ordem de Parada' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  openNew() {
    this.pontoEmbarque = {} as PontoEmbarque;
    this.submitted = false;
    this.pontoEmbarqueDialog = true;
  }

  carregarPontosEmbarque() {
    this.pontoEmbarqueService.listarPontoEmbarque().subscribe({
      next: (data) => {
        this.pontosEmbarque = data;
      },
      error:  (err) => console.error('Erro ao carregar pontos de embarque:', err),
    });
  }

  editPontoEmbarque(ponto: PontoEmbarque) {
    this.pontoEmbarque = { ...ponto };
    this.pontoEmbarqueDialog = true;
  }

  deleteSelectedPontosEmbarque() {
    this.confirmationService.confirm({
      message: 'Tem certeza de que deseja excluir os pontos de embarque selecionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Não',
        severity: 'secondary',
        variant: 'text',
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Sim',
      },
      accept: () => {
        this.pontosEmbarque = this.pontosEmbarque.filter((val: PontoEmbarque) => !this.selectedPontosEmbarque?.includes(val));
        this.selectedPontosEmbarque = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pontos de Embarque Excluídos',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.pontoEmbarqueDialog = false;
    this.submitted = false;
  }

  deletePontoEmbarque(ponto: PontoEmbarque) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir o ponto de embarque: ' + ponto.descricao + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {severity: 'danger', label: 'Sim'},
      rejectButtonProps: {label: 'Não', severity: 'secondary', variant: 'text'},
      accept: () => {
        this.pontoEmbarqueService.ExcluirPontoEmbarque(ponto.id!).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Sucesso', detail: 'Ponto de Embarque Excluído', life: 3000 });
            this.carregarPontosEmbarque();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({severity: 'error', summary: 'Erro', detail: 'Falha ao excluir o ponto de embarque', life: 3000 });
          }
        });
      }
    });
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.pontosEmbarque.length; i++) {
      if (this.pontosEmbarque[i].id == id) { 
        index = i;
        break;
      }
    }
    return index;
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