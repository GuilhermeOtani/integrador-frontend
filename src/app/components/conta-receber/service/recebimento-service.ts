import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormaPagamento, ReciboMatricula } from '../models/conta-receber';

@Injectable({ providedIn: 'root' })
export class RecebimentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recebimentos`;

  pagar(contaId: number, formaPagamento: FormaPagamento, valorPago?: number, chave?: string): Observable<ReciboMatricula> {
    let params = new HttpParams().set('formaPagamento', formaPagamento);
    if (valorPago !== undefined) params = params.set('valorPago', String(valorPago));
    const headers: Record<string, string> = {};
    if (chave) headers['Idempotency-Key'] = chave;
    return this.http.post<ReciboMatricula>(`${this.apiUrl}/realizar/${contaId}`, null, {
      params, headers,
    });
  }

  buscarRecibo(contaId: number): Observable<ReciboMatricula> {
    return this.http.get<ReciboMatricula>(`${this.apiUrl}/recibo/conta/${contaId}`);
  }
  listarRecibos(contaId: number): Observable<ReciboMatricula[]> {
    return this.http.get<ReciboMatricula[]>(`${this.apiUrl}/conta/${contaId}`);
  }
}
