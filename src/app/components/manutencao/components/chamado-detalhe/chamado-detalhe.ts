import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ChamadoManutencao } from '../../models/manutencao.models';
import { rotuloOnibus, rotuloEstadoOnibus, rotuloPrioridade, rotuloAndamento, papelSolicitante, severidadeAndamento, severidadePrioridade } from '../../utils/manutencao.utils';

@Component({
  standalone: true,
  selector: 'app-chamado-detalhe',
  imports: [DatePipe, TagModule],
  templateUrl: './chamado-detalhe.html',
  styleUrls: ['../../../dashboard/styles/dialog-dashboard.css', './chamado-detalhe.css'],
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
