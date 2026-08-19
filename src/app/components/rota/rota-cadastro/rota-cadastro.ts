import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { PickListModule } from 'primeng/picklist';
import { PontoEmbarque } from '../../ponto-embarque/model/ponto-embarque';
import { RotaService } from '../../rota/rota-service';
import rota from '../model/rota';
import { FaculdadeService } from '../../faculdade/faculdade-service';
import { PontoEmbarqueService } from '../../ponto-embarque/ponto-embarque-service';
import { AlunoService } from '../../aluno/aluno-service';

@Component({
  standalone: true,
  selector: 'app-rota-cadastro',
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    PickListModule,
  ],
  templateUrl: './rota-cadastro.html',
  styleUrl: './rota-cadastro.css',
})
export class RotaCadastro implements OnChanges {
  @Input() rota: rota = {} as rota;

  @Output() aoSalvar = new EventEmitter<void>();
  @Output() aoCancelar = new EventEmitter<void>();

  private rotaService = inject(RotaService);
  private messageService = inject(MessageService);

  private faculdadeService = inject(FaculdadeService);
  private pontoEmbarqueService = inject(PontoEmbarqueService);
  private alunoService = inject(AlunoService);

  submitted: boolean = false;

  faculdades: any[] = [];
  alunos: any[] = [];
  pontosDisponiveis: PontoEmbarque[] = [];
  pontosSelecionados: PontoEmbarque[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rota']) {
      this.submitted = false;

      if (this.rota && this.rota.pontosEmbarque) {
        this.pontosSelecionados = [...this.rota.pontosEmbarque];
      } else {
        this.pontosSelecionados = [];
      }

      // Recarrega as listas atualizadas
      this.carregarDadosAuxiliares();
    }
  }

  carregarDadosAuxiliares() {
    this.faculdadeService.listarFaculdades().subscribe((dados) => (this.faculdades = dados));
    this.alunoService.listarAlunos().subscribe((dados) => (this.alunos = dados));

    this.pontoEmbarqueService.listarPontoEmbarque().subscribe({
      next: (dados: any) => {
        if (this.pontosSelecionados.length > 0) {
          const selecionadosIds = this.pontosSelecionados.map((p) => p.id);
          this.pontosDisponiveis = dados.filter((p: any) => !selecionadosIds.includes(p.id));
        } else {
          this.pontosDisponiveis = [...dados];
        }
      },
      error: (err) => console.error('Erro ao carregar pontos de embarque:', err),
    });
  }

  confirmarSalvar() {
    this.submitted = true;

    this.rota.pontosEmbarque = this.pontosSelecionados;

    if (this.rota.id) {
      this.rotaService.atualizarRota(this.rota.id, this.rota).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Rota atualizada com sucesso!',
            life: 3000,
          });
          this.aoSalvar.emit();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar rota',
            life: 3000,
          });
        },
      });
    } else {
      this.rotaService.salvarRota(this.rota).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Rota cadastrada com sucesso!',
            life: 3000,
          });
          this.aoSalvar.emit();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao cadastrar rota',
            life: 3000,
          });
        },
      });
    }
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}
