import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormaPagamento, PagamentoResponse, ReciboPagamento } from '../../relatorios/models/relatorios.models';

@Injectable({
  providedIn: 'root',
})
export class PagamentoService {
  private readonly apiUrl = `${environment.apiUrl}/pagamentos`;

  constructor(private http: HttpClient) {}

  realizarPagamento(contaId: number, formaPagamento: FormaPagamento, valorPago: number | undefined, chave: string): Observable<PagamentoResponse> {
    let params = new HttpParams().set('formaPagamento', formaPagamento);

    if (valorPago !== undefined) {
      params = params.set('valorPago', valorPago.toString());
    }

    return this.http.post<PagamentoResponse>(`${this.apiUrl}/realizar/${contaId}`, null, { params, headers: { 'Idempotency-Key': chave } });
  }

  buscarReciboPorConta(contaId: number): Observable<ReciboPagamento> {
    return this.http.get<ReciboPagamento>(`${this.apiUrl}/recibo/conta/${contaId}`);
  }

  listarPorConta(contaId: number): Observable<ReciboPagamento[]> {
    return this.http.get<ReciboPagamento[]>(`${this.apiUrl}/conta/${contaId}`);
  }
}
