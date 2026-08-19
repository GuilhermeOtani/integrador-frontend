import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect'; 
import { TagModule } from 'primeng/tag';

import { GradeDiariaService } from '../grade-diaria-service';
import { RotaService } from '../../rota/rota-service';
import { OnibusService } from '../../onibus/onibus-service';
import { MotoristaService } from '../../motorista/motorista-service';
import { FaculdadeService } from '../../faculdade/faculdade-service'; 

@Component({
  standalone: true,
  selector: 'app-grade-diaria-cadastro',
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule, TableModule, MultiSelectModule, TagModule],
  templateUrl: './grade-diaria-cadastro.html',
  styleUrl: './grade-diaria-cadastro.css',
})
export class GradeDiariaCadastro implements OnInit {
  
  @Input() grade: any = {};
  @Output() aoSalvar = new EventEmitter<void>();
  @Output() aoCancelar = new EventEmitter<void>();

  private gradeDiariaService = inject(GradeDiariaService);
  private messageService = inject(MessageService);
  private rotaService = inject(RotaService);
  private onibusService = inject(OnibusService);
  private motoristaService = inject(MotoristaService);
  private faculdadeService = inject(FaculdadeService); 

  submitted: boolean = false;
  novaViagem: any = { faculdadesIds: [] }; 

  listaDiasSemana = [
    { label: 'Segunda-feira', value: 'SEGUNDA' },
    { label: 'Terça-feira', value: 'TERCA' },
    { label: 'Quarta-feira', value: 'QUARTA' },
    { label: 'Quinta-feira', value: 'QUINTA' },
    { label: 'Sexta-feira', value: 'SEXTA' },
    { label: 'Sábado', value: 'SABADO' },
    { label: 'Domingo', value: 'DOMINGO' }
  ];

  listaRotas: any[] = [];
  listaOnibus: any[] = [];
  listaMotoristas: any[] = [];
  listaFaculdades: any[] = [];

  ngOnInit(): void {
    if (!this.grade.viagens) {
      this.grade.viagens = [];
    }
    this.carregarListasAuxiliares();
  }

  carregarListasAuxiliares() {
    this.rotaService.listarTodasRotas().subscribe({ next: (d) => this.listaRotas = d });
    this.onibusService.listarOnibus().subscribe({ next: (d) => this.listaOnibus = d });
    this.motoristaService.listarMotoristas().subscribe({ next: (d) => this.listaMotoristas = d });
    this.faculdadeService.listarFaculdades().subscribe({ next: (d) => this.listaFaculdades = d });
  }

  adicionarViagem() {
    if (this.novaViagem.rotaId && this.novaViagem.onibusId && this.novaViagem.motoristaId && this.novaViagem.faculdadesIds?.length > 0) {
      const rota = this.listaRotas.find(r => r.id === this.novaViagem.rotaId);
      const onibus = this.listaOnibus.find(o => o.id === this.novaViagem.onibusId);
      const motorista = this.listaMotoristas.find(m => m.id === this.novaViagem.motoristaId);
      
      const faculdadesSelecionadas = this.listaFaculdades.filter(f => this.novaViagem.faculdadesIds.includes(f.id));

      this.grade.viagens.push({
        rotaId: rota.id,
        rotaNome: rota.nome,
        onibusId: onibus.id,
        onibusPlaca: onibus.placa,
        numeroIdentificacao: onibus.numeroIdentificacao,
        motoristaId: motorista.id,
        motoristaNome: motorista.nome,
        faculdades: faculdadesSelecionadas 
      });

      this.novaViagem = { faculdadesIds: [] }; 
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha Rota, Ônibus, Motorista e ao menos 1 Faculdade.', life: 4000 });
    }
  }

  removerViagem(index: number) {
    this.grade.viagens.splice(index, 1);
  }

  extrairNomeFaculdade(faculdade: any): string {
    if (!faculdade) return '';
    if (typeof faculdade === 'string') return faculdade;
    return faculdade.nome || faculdade.descricao || faculdade.razaoSocial || 'Desconhecida';
  }

 confirmarSalvar() {
    this.submitted = true;
    if (this.grade.diaSemana) {
        if (this.grade.id) {
            this.atualizarGradeExistente();
        } else {
            this.cadastrarNovaGrade();
        }
    }
  }

  atualizarGradeExistente() {
    this.gradeDiariaService.atualizarGrade(this.grade.id, this.grade).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grade Atualizada!', life: 3000 });
        this.aoSalvar.emit();
      }
    });
  }

  cadastrarNovaGrade() {
    this.gradeDiariaService.salvarGrade(this.grade).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grade Cadastrada!', life: 3000 });
        this.aoSalvar.emit();
      }
    });
  }

  cancelar() {
    this.aoCancelar.emit();
  }
}