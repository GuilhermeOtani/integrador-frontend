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
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { OnibusCadastro } from '../onibus-cadastro/onibus-cadastro';
import onibus from '../model/onibus';
import { OnibusService } from '../../onibus/onibus-service';

@Component({
  standalone: true,
  selector: 'app-onibus-listar',
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
    OnibusCadastro
  ],

  providers: [OnibusService, MessageService, ConfirmationService],
  templateUrl: './onibus-listar.html',
  styleUrl: './onibus-listar.css',
})
export class OnibusListar {
  private onibusService = inject(OnibusService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  onibusDialog: boolean = false;
  onibuss: onibus[] = [];
  onibus: onibus = {} as onibus;
  selectedOnibus: onibus[] | null = null;
  submitted: boolean = false;
  statuses!: any[];
  cols!: Column[];
  exportColumns!: ExportColumn[];
  @ViewChild('dt') dt!: Table;

  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarOnibus() {
    this.onibusDialog = false;
    this.onibus = {} as onibus;
    this.carregarOnibuss();
  }

  ngOnInit() {
    this.carregaronibus();

    this.statuses = [
      { label: 'OPERANDO', value: 'operando' },
      { label: 'MANUTENÇÂO', value: 'manutencao' },
      { label: 'QUBERADO', value: 'quebrado' },
      { label: 'INATIVO', value: 'inativo' },
    ];

    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Onibus ID' },
      { field: 'numeroIdentificacao', header: 'Número de Identificação' },
      { field: 'placa', header: 'Placa' },
      { field: 'modelo', header: 'Modelo' },
      { field: 'statusOnibus', header: 'Status do Ônibus' },
      { field: 'fotoUrl', header: 'Foto' },
      { field: 'capacidade', header: 'Capacidade' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  openNew() {
    this.onibus = {} as onibus;
    this.submitted = false;
    this.onibusDialog = true;
  }

  carregarOnibuss() {
    this.onibusService.listarOnibus().subscribe({
      next: (data) => {
        this.onibuss = data;
      },
      error: (err) => console.error('Erro ao carregar onibuss:', err),
    });
  }

  carregaronibus() {
    this.onibusService.listarOnibus().subscribe({
      next: (data) => {
        this.onibuss = data;
      },
      error: (err) => console.error('Erro ao carregar onibuss:', err),
    });
  }

  editOnibus(onibus: onibus) {
    this.onibus = { ...onibus };
    this.onibusDialog = true;
  }

     getSeverity(status: string) {
        switch (status) {
            case 'OPERANDO':
                return 'success';
            case 'MANUTENCAO':
                return 'warn';
                case 'QUEBRADO':
                return 'danger';
            case 'INATIVO':
                return 'danger';
                default:
                  return 'info';
        }
    }

  deleteSelectedOnibuss() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected onibuss?',
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
        this.onibuss = this.onibuss.filter((val: onibus) => !this.selectedOnibus?.includes(val));
        this.selectedOnibus = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Onibus Deleted',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.onibusDialog = false;
    this.submitted = false;
  }

  deleteOnibus(onibus: onibus) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este onibus ' + onibus.placa + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      accept: () => {
        this.onibusService.ExcluirOnibus(onibus.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successful',
              detail: 'Onibus Deleted',
              life: 3000,
            });
            this.carregarOnibuss();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete onibus',
              life: 3000,
            });
          },
        });
      },
    });
  }
  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.onibuss.length; i++) {
      if (this.onibuss[i].id == id) {
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

