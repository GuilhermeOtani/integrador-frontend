import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PagamentoService {
  private apiUrl = 'http://localhost:8080/pagamentos';

  constructor(private http: HttpClient) {}

  realizarPagamento(contaId: number, formaPagamento: string, valorPago?: number): Observable<any> {
    let params = new HttpParams().set('formaPagamento', formaPagamento);

    if (valorPago) {
      params = params.set('valorPago', valorPago.toString());
    }

    return this.http.post<any>(`${this.apiUrl}/realizar/${contaId}`, null, { params });
  }

  buscarReciboPorConta(contaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recibo/conta/${contaId}`);
  }
}
