import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AssinaturaWhatsapp, AtivacaoWhatsapp, ConfiguracaoWhatsapp, HistoricoWhatsapp, LoteWhatsapp, PreviaWhatsapp, SolicitarEnvioWhatsapp } from '../models/whatsapp.models';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly http = inject(HttpClient);
  private readonly pessoal = `${environment.apiUrl}/whatsapp`;
  private readonly admin = `${environment.apiUrl}/integracoes/whatsapp`;
  minhaAssinatura() { return this.http.get<AssinaturaWhatsapp>(`${this.pessoal}/minha-assinatura`); }
  solicitarAtivacao(numero: string, aceite: boolean) { return this.http.post<AtivacaoWhatsapp>(`${this.pessoal}/minha-assinatura/ativacao`, { numero, aceite }); }
  cancelar() { return this.http.delete<void>(`${this.pessoal}/minha-assinatura`); }
  meuPdf() { return this.http.get(`${this.pessoal}/minha-programacao/pdf`, { responseType: 'blob' }); }
  configuracao() { return this.http.get<ConfiguracaoWhatsapp>(`${this.admin}/configuracao`); }
  configurarAutomatico(automatico: boolean) { return this.http.put<ConfiguracaoWhatsapp>(`${this.admin}/configuracao`, { automatico }); }
  previa(usuarioId: number) { return this.http.get<PreviaWhatsapp>(`${this.admin}/previa`, { params: new HttpParams().set('usuarioId', usuarioId) }); }
  previaPdf(usuarioId: number) { return this.http.get(`${this.admin}/previa/pdf`, { params: new HttpParams().set('usuarioId', usuarioId), responseType: 'blob' }); }
  enviar(dados: SolicitarEnvioWhatsapp) { return this.http.post<LoteWhatsapp>(`${this.admin}/envios`, dados); }
  historico(pagina = 0, tamanho = 20) { return this.http.get<HistoricoWhatsapp>(`${this.admin}/envios`, { params: new HttpParams().set('pagina', pagina).set('tamanho', tamanho) }); }
  lote(id: string) { return this.http.get<LoteWhatsapp>(`${this.admin}/envios/${encodeURIComponent(id)}`); }
}
