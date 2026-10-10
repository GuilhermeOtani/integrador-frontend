import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ChamadoManutencao } from '../../models/manutencao.models';
import { rotuloOnibus, rotuloEstadoOnibus, rotuloPrioridade, rotuloAndamento, papelSolicitante, severidadeAndamento, severidadePrioridade } from '../../utils/manutencao.utils';

@Component({
  standalone: true,
  selector: 'app-chamado-detalhe',
  imports: [DatePipe, TagModule],
  template: `
    @if (chamado(); as c) {
      <div class="flex flex-col gap-3">
        <p><strong>Chamado #{{ c.id }}</strong> · {{ c.dataAbertura | date:'dd/MM/yyyy':'UTC' }}</p>
        <p><strong>Solicitante:</strong> {{ c.solicitante.nome }} ({{ papel(c.solicitante.tipoPessoa) }})</p>
        <p><strong>Ônibus:</strong> {{ onibus(c.onibus) }}</p>
        <p><strong>Estado atual do ônibus:</strong> {{ estado(c.onibus.statusOnibus) }}</p>
        <div class="flex gap-2">
          <p-tag [value]="prioridade(c.urgencia)" [severity]="corPrioridade(c.urgencia)" />
          <p-tag [value]="andamento(c.status)" [severity]="corAndamento(c.status)" />
        </div>
        <h3 class="font-semibold">Relato original</h3>
        <p class="texto">{{ c.descricao }}</p>
        @if (mostrarResposta()) {
          <h3 class="font-semibold">Resposta da administração</h3>
          <p class="texto">{{ c.observacaoAdmin || 'Aguardando resposta' }}</p>
        }
      </div>
    }
  `,
  styles: ['.texto { white-space: pre-wrap; overflow-wrap: anywhere; }'],
})
export class ChamadoDetalhe {
  readonly chamado = input.required<ChamadoManutencao>();
  readonly mostrarResposta = input(true);
  readonly onibus = rotuloOnibus;
  readonly estado = rotuloEstadoOnibus;
  readonly prioridade = rotuloPrioridade;
  readonly andamento = rotuloAndamento;
  readonly papel = papelSolicitante;
  readonly corPrioridade = severidadePrioridade;
  readonly corAndamento = severidadeAndamento;
}
