import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/auth/utils/api-error';
import { Acerto, FiltroAcerto, FiltroFluxo, FiltroInadimplencia, FluxoCaixa, Inadimplencia, SaldoBase, SaldoBaseRequest, TipoRelatorio } from '../models/relatorios.models';
@Injectable({ providedIn: 'root' })
export class RelatoriosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private params(filtro: object): HttpParams {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '' && valor !== 0) params = params.set(chave, String(valor));
    }
    return params;
  }
  inadimplencia(filtro: FiltroInadimplencia) { return this.http.get<Inadimplencia>(`${this.base}/relatorios/inadimplencia`, { params: this.params(filtro) }); }
  fluxo(filtro: FiltroFluxo) { return this.http.get<FluxoCaixa>(`${this.base}/relatorios/fluxo-caixa`, { params: this.params(filtro) }); }
  acerto(filtro: FiltroAcerto) { return this.http.get<Acerto>(`${this.base}/relatorios/acerto-motoristas`, { params: this.params(filtro) }); }
  pdf(tipo: TipoRelatorio, filtro: object) {
    return this.http.get(`${this.base}/relatorios/${tipo}/pdf`, { params: this.params(filtro), responseType: 'blob', observe: 'response' });
  }
  saldoBase() { return this.http.get<SaldoBase>(`${this.base}/financeiro/saldo-base`); }
  salvarSaldoBase(entrada: SaldoBaseRequest) { return this.http.put<SaldoBase>(`${this.base}/financeiro/saldo-base`, entrada); }
}
export function baixarPdf(resposta: HttpResponse<Blob>): void {
  if (!resposta.body?.size) throw new Error('O servidor retornou um arquivo vazio.');
  const cabecalho = resposta.headers.get('Content-Disposition') ?? '';
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho)?.[1];
  let recebido = /filename="?([^";]+)"?/i.exec(cabecalho)?.[1] ?? 'relatorio.pdf';
  if (utf) { try { recebido = decodeURIComponent(utf); } catch { /* Utilizar filename ou nome padrão. */ } }
  const nome = recebido.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_').trim().replace(/^\.+/, '') || 'relatorio.pdf';
  const url = URL.createObjectURL(resposta.body);
  const link = document.createElement('a');
  try { link.href = url; link.download = nome; document.body.appendChild(link); link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
export async function mensagemErroDownload(erro: unknown): Promise<string> {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 401 || erro.status === 403 || erro.status === 0) return mensagemApi(erro);
    if (erro.error instanceof Blob) {
      try {
        const p: unknown = JSON.parse(await erro.error.text());
        if (p && typeof p === 'object') {
          const v = p as { detail?: unknown; title?: unknown };
          if (typeof v.detail === 'string' && v.detail) return v.detail;
          if (typeof v.title === 'string' && v.title) return v.title;
        }
      } catch { /* Falha sem ProblemDetail legível. */ }
      return 'Não foi possível gerar o relatório. Tente novamente.';
    }
    return mensagemApi(erro);
  }
  return 'Não foi possível baixar o relatório. Tente novamente.';
}
