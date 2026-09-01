import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import GradeDiaria from '../model/grade-diaria';
import { GradeDiariaService } from '../grade-diaria-service';
import { GradeDiariaCadastro } from '../grade-diaria-cadastro/grade-diaria-cadastro'; 
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-grade-diaria-listar',
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
    GradeDiariaCadastro,
    TooltipModule,
    BadgeModule,
  ],
  providers: [GradeDiariaService, MessageService, ConfirmationService],
  templateUrl: './grade-diaria-listar.html',
  styleUrl: './grade-diaria-listar.css', 
})
export class GradeDiariaListar implements OnInit {
  private gradeDiariaService = inject(GradeDiariaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private readonly auth = inject(AuthService);
  readonly podeEditar = computed(() => this.auth.temPapel('ADMIN'));
  
  gradeDialog: boolean = false;
  
  detalhesDialog: boolean = false;
  gradeSelecionadaParaDetalhes: GradeDiaria | null = null;

  grades: GradeDiaria[] = [];
  grade: GradeDiaria = new GradeDiaria();
  selectedGrade: GradeDiaria[] | null = null;
  submitted: boolean = false;
  
  cols!: Column[];
  exportColumns!: ExportColumn[];
  @ViewChild('dt') dt!: Table;

  ngOnInit() {
    this.carregarGrades();

    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Grade ID' },
      { field: 'diaSemana', header: 'Dia da Semana' },
      { field: 'descricao', header: 'Descrição' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  
  exportCSV() {
    this.dt.exportCSV();
  }

  aoSalvarGrade() {
    this.gradeDialog = false;
    this.grade = new GradeDiaria();
    this.carregarGrades();
  }

  openNew() {
    this.grade = new GradeDiaria();
    this.submitted = false;
    this.gradeDialog = true;
  }

  carregarGrades() {
    this.gradeDiariaService.listarTodasGrades().subscribe({
      next: (data) => {
        this.grades = data;
        
        console.log("DADOS RECEBIDOS DO BACKEND:", data);
        if(data.length > 0 && data[0].viagens) {
           console.log("VIAGENS DA PRIMEIRA GRADE:", data[0].viagens);
        }
        
      },
      error: (err) => console.error('Erro ao carregar grades diárias:', err),
    });
  }

  editGrade(grade: GradeDiaria) {
    this.grade = { ...grade };
    this.gradeDialog = true;
  }

  abrirDetalhes(grade: GradeDiaria) {
    this.gradeSelecionadaParaDetalhes = grade;
    this.detalhesDialog = true;
  }

  deleteSelectedGrades() {
    this.confirmationService.confirm({
      message: 'Você tem certeza que deseja excluir as grades selecionadas?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.grades = this.grades.filter((val: GradeDiaria) => !this.selectedGrade?.includes(val));
        this.selectedGrade = null;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grades Deletadas', life: 3000 });
      },
    });
  }

  hideDialog() {
    this.gradeDialog = false;
    this.submitted = false;
  }

  deleteGrade(grade: GradeDiaria) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir a grade de ' + grade.diaSemana + '?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      accept: () => {
        this.gradeDiariaService.deletarGradePorId(grade.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grade Diária Deletada', life: 3000 });
            this.carregarGrades();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao deletar grade', life: 3000 });
          },
        });
      },
    });
  }

  extrairNomeFaculdade(faculdade: any): string {
    if (!faculdade) return '';
    if (typeof faculdade === 'string') return faculdade;
    return faculdade.nome || faculdade.descricao || faculdade.razaoSocial || 'Desconhecido';
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
