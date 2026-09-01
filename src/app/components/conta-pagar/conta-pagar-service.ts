import { Injectable } from '@angular/core';
import { ContaPagar } from './model/conta-pagar';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContaPagarService {
  private readonly apiUrl = `${environment.apiUrl}/contapagar`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/listar`);
  }

  atualizarConta(id: number, conta: ContaPagar): Observable<ContaPagar> {
    return this.http.put<ContaPagar>(`${this.apiUrl}/atualizar-contapagar/${id}`, conta);
  }
}
