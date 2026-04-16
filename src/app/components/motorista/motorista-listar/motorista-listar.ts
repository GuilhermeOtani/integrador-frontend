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
import { MotoristaService } from '../motorista-service';
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MotoristaCadastro } from '../motorista-cadastro/motorista-cadastro';
import motorista from '../model/motorista';
import { OnibusService } from '../../onibus/onibus-service';


@Component({
  standalone: true,
  selector: 'app-motorista-listar',
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
    MotoristaCadastro
  ],
  providers: [MotoristaService, MessageService, ConfirmationService],
  templateUrl: './motorista-listar.html',
  styleUrl: './motorista-listar.css',
})
export class MotoristaListar {
  private motoristaService = inject(MotoristaService);
  private onibusService = inject(OnibusService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  motoristaDialog: boolean = false;
  motoristas: motorista[] = []; 
  motorista: motorista = {} as motorista; 
  onibuss: any[] = [];
  selectedMotoristas: motorista[] | null = null;
  submitted: boolean = false;
  statuses!: any[];
  cols!: Column[];
  exportColumns!: ExportColumn[];
  @ViewChild('dt') dt!: Table;

  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarMotorista() {
      this.motoristaDialog = false;
      this.motorista = {} as motorista;
      this.carregarMotoristas(); 
  }

  ngOnInit() {
    this.carregarMotoristas();
    this.carregarOnibus();
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Motorista ID' },
      { field: 'nome', header: 'Nome' },
      { field: 'cpfCnpj', header: 'CPF/CNPJ' },
      { field: 'telefone', header: 'Telefone' },
      { field: 'cnh', header: 'CNH' },
      { field: 'salario', header: 'Salário' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  openNew() {
    this.motorista = {} as motorista;
    this.submitted = false;
    this.motoristaDialog = true;
  }

  carregarMotoristas() {
    this.motoristaService.listarMotoristas().subscribe({
      next: (data) => {
      this.motoristas = data;
      },
      error:  (err) => console.error('Erro ao carregar motoristas:', err),
    });
  }

  carregarOnibus() {
    this.onibusService.listarOnibus().subscribe({
      next: (data) => {
        this.onibuss = data;
        },
        error:  (err) => console.error('Erro ao carregar onibuss:', err),
      });
  }

  editMotorista(motorista: motorista) {
    this.motorista = { ...motorista };

    if(this.motorista.onibus) {
      this.motorista.onibusId = this.motorista.onibus.id;
    }

    this.motoristaDialog = true;
  }

  deleteSelectedMotoristas() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected motoristas?',
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
        this.motoristas = this.motoristas.filter((val: motorista) => !this.selectedMotoristas?.includes(val));
        this.selectedMotoristas = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Motorista Deletado',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.motoristaDialog = false;
    this.submitted = false;
  }

  deleteMotorista(motorista: motorista) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este motorista ' + motorista.nome + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {severity: 'danger', label: 'Sim'},
      rejectButtonProps: {label: 'Não', severity: 'secondary', variant: 'text'},
      accept: () => {
        this.motoristaService.ExcluirMotoristas(motorista.id).subscribe({
          next: () => {
        this.messageService.add({severity: 'success', summary: 'Successful', detail: 'Motorista Deleted', life: 3000 });
        this.carregarMotoristas();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to delete motorista', life: 3000 });
      }
    });
  }
});
    }
  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.motoristas.length; i++) {
      if (this.motoristas[i].id == id) { 
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
