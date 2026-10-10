import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormaPagamento, ReciboMatricula } from '../models/conta-receber';

@Injectable({ providedIn: 'root' })
export class RecebimentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recebimentos`;

  pagar(contaId: number, formaPagamento: FormaPagamento): Observable<ReciboMatricula> {
    const params = new HttpParams().set('formaPagamento', formaPagamento);
    return this.http.post<ReciboMatricula>(`${this.apiUrl}/realizar/${contaId}`, null, {
      params,
    });
  }

  buscarRecibo(contaId: number): Observable<ReciboMatricula> {
    return this.http.get<ReciboMatricula>(`${this.apiUrl}/recibo/conta/${contaId}`);
  }
}
