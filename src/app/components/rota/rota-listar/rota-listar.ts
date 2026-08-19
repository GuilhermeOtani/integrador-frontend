import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import rota from '../model/rota';
import { RotaService } from '../../rota/rota-service';
import { RotaCadastro } from '../rota-cadastro/rota-cadastro';

@Component({
  standalone: true,
  selector: 'app-rota-listar',
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    FileUploadModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    FormsModule,
    RotaCadastro,
  ],
  providers: [RotaService, MessageService, ConfirmationService],
  templateUrl: './rota-listar.html',
  styleUrl: './rota-listar.css',
})
export class RotaListar implements OnInit {
  private rotaService = inject(RotaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  rotaDialog: boolean = false;
  rotas: rota[] = [];
  rota: rota = {} as rota;
  selectedRotas: rota[] | null = null;
  submitted: boolean = false;
  detalhesDialog: boolean = false;
  rotaDetalhe: rota = {} as rota;

  cols!: Column[];
  exportColumns!: ExportColumn[];

  @ViewChild('dt') dt!: Table;

  ngOnInit() {
    this.carregarRotas();

    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Rota ID' },
      { field: 'nome', header: 'Nome da Rota' },
      { field: 'descricao', header: 'Descrição' },
      { field: 'faculdade.nome', header: 'Faculdade Destino' },
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarRota() {
    this.rotaDialog = false;
    this.rota = {} as rota;
    this.carregarRotas();
  }

  openNew() {
    this.rota = {} as rota;
    this.submitted = false;
    this.rotaDialog = true;
  }

  carregarRotas() {
    this.rotaService.listarTodasRotas().subscribe({
      next: (data) => {
        this.rotas = data;
      },
      error: (err) => console.error('Erro ao carregar rotas:', err),
    });
  }

  editRota(rotaSelecionada: rota) {
    this.rota = { ...rotaSelecionada };
    this.rotaDialog = true;
  }

  verDetalhes(rotaSelecionada: rota) {
    console.log('DADOS DA ROTA SELECIONADA: ', rotaSelecionada);
    this.rotaDetalhe = { ...rotaSelecionada };
    this.detalhesDialog = true;
  }

  deleteSelectedRotas() {
    this.confirmationService.confirm({
      message: 'Você tem certeza que deseja excluir as rotas selecionadas?',
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
        this.rotas = this.rotas.filter((val: rota) => !this.selectedRotas?.includes(val));
        this.selectedRotas = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Rotas Deletadas',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.rotaDialog = false;
    this.submitted = false;
  }

  deleteRota(rotaSelecionada: rota) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta rota: ' + rotaSelecionada.nome + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      accept: () => {
        this.rotaService.deletarRotaPorId(rotaSelecionada.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Rota Deletada',
              life: 3000,
            });
            this.carregarRotas();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao deletar rota',
              life: 3000,
            });
          },
        });
      },
    });
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.rotas.length; i++) {
      if (this.rotas[i].id == id) {
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
