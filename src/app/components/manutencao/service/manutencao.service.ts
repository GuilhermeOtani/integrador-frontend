import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AbrirChamado, AtenderChamado, ChamadoManutencao, FiltrosChamado, OnibusChamado } from '../models/manutencao.models';

@Injectable({ providedIn: 'root' })
export class ManutencaoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl.replace(/\/$/, '')}/chamados-manutencao`;

  listarOnibus() { return this.http.get<OnibusChamado[]>(`${this.url}/onibus`); }
  minhas() { return this.http.get<ChamadoManutencao[]>(`${this.url}/minhas`); }
  buscar(id: number) { return this.http.get<ChamadoManutencao>(`${this.url}/${id}`); }
  abrir(body: AbrirChamado) {
    return this.http.post<ChamadoManutencao>(this.url, {
      onibusId: body.onibusId, descricao: body.descricao,
    });
  }
  listar(filtros: FiltrosChamado = {}) {
    let params = new HttpParams();
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.urgencia) params = params.set('urgencia', filtros.urgencia);
    if (filtros.onibusId != null) params = params.set('onibusId', filtros.onibusId);
    return this.http.get<ChamadoManutencao[]>(this.url, { params });
  }
  atender(id: number, body: AtenderChamado) {
    // Explicit allow-list: never send the full ticket or bus record back to the API.
    const request: AtenderChamado = {
      urgencia: body.urgencia, status: body.status, observacaoAdmin: body.observacaoAdmin,
    };
    if (body.statusOnibus !== undefined) request.statusOnibus = body.statusOnibus;
    return this.http.put<ChamadoManutencao>(`${this.url}/${id}/atendimento`, request);
  }
}
