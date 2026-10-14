import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { FaculdadeResumo, RotaResumo, TransporteResumo, ViagemResumo } from '../../models/dashboard.models';
import { ESTADOS_ONIBUS } from '../../../manutencao/models/manutencao.models';
@Component({
  selector: 'app-agenda-transporte', standalone: true,
  imports: [CommonModule, MessageModule, TagModule, ButtonModule, DialogModule],
  templateUrl: './agenda-transporte.html',
  styleUrls: ['../../styles/dashboard.css', '../../styles/dialog-dashboard.css', './agenda-transporte.css'],
})
export class AgendaTransporte {
  readonly transporte = input.required<TransporteResumo>();
  readonly dataReferencia = input.required<string>();
  readonly perfil = input<'aluno' | 'motorista'>('motorista');
  readonly faculdade = input<FaculdadeResumo | null>(null);
  readonly avisos = input<string[]>([]);
  readonly chaveSelecionada = input<string | null>(null);
  readonly selecaoAlterada = output<string | null>();
  private readonly escolhaLocal = signal<string | null>(null);
  readonly viagemDetalhe = signal<ViagemResumo | null>(null);
  readonly rotaDetalhe = signal<RotaResumo | null>(null);
  readonly viagens = computed(() => {
    const dados = this.transporte();
    const vistas = new Set<string>();
    return [...dados.viagensHoje, ...dados.agendaSemanal.filter(v => !!v.dataOcorrencia && v.dataOcorrencia >= this.dataReferencia())]
      .filter(v => { const chave = this.chave(v); if (vistas.has(chave)) return false; vistas.add(chave); return true; });
  });
  readonly selecionada = computed<ViagemResumo | null>(() => {
    const chave = this.escolhaLocal() ?? this.chaveSelecionada();
    return this.viagens().find(v => this.chave(v) === chave) ?? this.viagens()[0] ?? null;
  });
  readonly outrasViagens = computed(() => this.viagens().filter(v => this.chave(v) !== this.chave(this.selecionada())));
  readonly rotasAdicionais = computed(() => {
    const usadas = new Set([...this.viagens(), ...this.transporte().programacaoSemGrade].map(v => v.rota?.id));
    return this.transporte().rotas.filter(r => !usadas.has(r.id));
  });
  readonly alertas = computed(() => [...new Set([
    ...this.avisos(), ...(this.selecionada() ? this.avisosViagem(this.selecionada()!) : []),
  ])]);
  constructor() { effect(() => this.selecaoAlterada.emit(this.selecionada() ? this.chave(this.selecionada()) : null)); }
  chave(viagem: ViagemResumo | null): string { return viagem ? `${viagem.id}:${viagem.dataOcorrencia ?? 'sem-data'}` : ''; }
  selecionar(chave: string): void { this.escolhaLocal.set(chave); }
  detalhes(viagem: ViagemResumo): void { this.rotaDetalhe.set(null); this.viagemDetalhe.set(viagem); }
  detalhesRota(rota: RotaResumo): void { this.viagemDetalhe.set(null); this.rotaDetalhe.set(rota); }
  fecharDetalhes(): void { this.viagemDetalhe.set(null); this.rotaDetalhe.set(null); }
  avisosViagem(viagem: ViagemResumo): string[] {
    const avisos = [...new Set(viagem.avisos)];
    // O backend já costuma explicar a indisponibilidade; o fallback só cobre a ausência desse aviso.
    if (!viagem.onibusDisponivel && !avisos.some(aviso => /ônibus.*(indisponível|estado não informado)/i.test(aviso)))
      avisos.push('Ônibus indisponível. Confirme o transporte com a administração.');
    return avisos;
  }
  estado(valor: string | null | undefined): string { return ESTADOS_ONIBUS.find(e => e.value === valor)?.label ?? 'Não informado'; }
  dia(valor: string | null | undefined): string {
    return ({ SEGUNDA: 'Segunda-feira', TERCA: 'Terça-feira', QUARTA: 'Quarta-feira', QUINTA: 'Quinta-feira', SEXTA: 'Sexta-feira' } as Record<string, string>)[valor ?? ''] ?? 'Dia não informado';
  }
}
