import { Component, inject, ViewChild } from '@angular/core';
import { FaculdadeCadastro } from '../faculdade-cadastro/faculdade-cadastro';
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
import { FaculdadeService } from '../faculdade-service';
import faculdade from '../model/faculdade';

@Component({
  standalone: true,
  selector: 'app-faculdade-listar',
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
    FaculdadeCadastro
  ],
    providers: [FaculdadeService, MessageService, ConfirmationService],
  templateUrl: './faculdade-listar.html',
  styleUrl: './faculdade-listar.css',
})
export class FaculdadeListar {

  private faculdadeService = inject(FaculdadeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  faculdadeDialog: boolean = false;
 faculdades: faculdade[] = []; 
  faculdade: faculdade = {} as faculdade; 
  selectedFaculdades: faculdade[] | null = null;
  submitted: boolean = false;
  statuses!: any[];
  cols!: Column[];
  exportColumns!: ExportColumn[];
  @ViewChild('dt') dt!: Table;

  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarFaculdade() {
      this.faculdadeDialog = false;
      this.faculdade = {} as faculdade;
      this.carregarFaculdades(); 
  }

  ngOnInit() {
    this.carregarFaculdades();
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Faculdade ID' },
      { field: 'nome', header: 'Nome' },
      { field: 'endereco', header: 'Endereço' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  openNew() {
    this.faculdade = {} as faculdade;
    this.submitted = false;
    this.faculdadeDialog = true;
  }

  carregarFaculdades() {
    this.faculdadeService.listarFaculdades().subscribe({
      next: (data) => {
      this.faculdades = data;
      },
      error:  (err) => console.error('Erro ao carregar faculdades:', err),
    });
  }

  editFaculdade(faculdade: faculdade) {
    this.faculdade = { ...faculdade };
    this.faculdadeDialog = true;
  }

  deleteSelectedFaculdades() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected faculdades?',
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
        this.faculdades = this.faculdades.filter((val: faculdade) => !this.selectedFaculdades?.includes(val));
        this.selectedFaculdades = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Faculdades Deleted',
          life: 3000,
        });
      },
    });
  }

  hideDialog() {
    this.faculdadeDialog = false;
    this.submitted = false;
  }

  deleteFaculdade(faculdade: faculdade) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este faculdade ' + faculdade.nome + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {severity: 'danger', label: 'Sim'},
      rejectButtonProps: {label: 'Não', severity: 'secondary', variant: 'text'},
      accept: () => {
        this.faculdadeService.ExcluirFaculdades(faculdade.id).subscribe({
          next: () => {
        this.messageService.add({severity: 'success', summary: 'Successful', detail: 'Faculdade Deleted', life: 3000 });
        this.carregarFaculdades();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to delete faculdade', life: 3000 });
      }
    });
  }
});
    }
  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.faculdades.length; i++) {
      if (this.faculdades[i].id == id) { 
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
