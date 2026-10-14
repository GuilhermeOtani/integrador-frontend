import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConfiguracaoEmail, EnvioEmailRequest, HistoricoEmail, LoteEmail, PreviaEmail } from '../models/email-programacao.models';

@Injectable({ providedIn: 'root' })
export class EmailProgramacaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl.replace(/\/$/, '')}/integracoes/email`;
  configuracao(): Observable<ConfiguracaoEmail> { return this.http.get<ConfiguracaoEmail>(`${this.base}/configuracao`); }
  configurar(automatico: boolean): Observable<ConfiguracaoEmail> { return this.http.put<ConfiguracaoEmail>(`${this.base}/configuracao`, { automatico }); }
  previa(): Observable<PreviaEmail> { return this.http.get<PreviaEmail>(`${this.base}/previa`); }
  enviar(request: EnvioEmailRequest): Observable<LoteEmail> {
    // Constrói o contrato mínimo mesmo se um chamador receber dados adicionais em runtime.
    const body: EnvioEmailRequest = { requestId: request.requestId, reenviar: request.reenviar };
    if (request.reenviar) body.motivo = request.motivo;
    return this.http.post<LoteEmail>(`${this.base}/envios`, body);
  }
  historico(pagina = 0, tamanho = 20): Observable<HistoricoEmail> {
    return this.http.get<HistoricoEmail>(`${this.base}/envios`, { params: { pagina, tamanho } });
  }
  detalhe(id: string): Observable<LoteEmail> { return this.http.get<LoteEmail>(`${this.base}/envios/${encodeURIComponent(id)}`); }
}
