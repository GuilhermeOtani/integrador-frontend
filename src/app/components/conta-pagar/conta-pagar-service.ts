import { Injectable } from '@angular/core';
import { ContaPagar } from './model/conta-pagar';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ContaPagarService {
  private apiUrl = 'http://localhost:8080/contapagar';

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/listar`);
  }

  atualizarConta(id: number, conta: ContaPagar): Observable<ContaPagar> {
    return this.http.put<ContaPagar>(`${this.apiUrl}/atualizar-contapagar/${id}`, conta);
  }
}
