import { Injectable } from '@angular/core';
import { ContaPagar } from '../models/conta-pagar';
import { ContaPagarRequest } from '../../relatorios/models/relatorios.models';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContaPagarService {
  private readonly apiUrl = `${environment.apiUrl}/contapagar`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/listar`).pipe(map(lista => {
      if (!Array.isArray(lista)) throw this.incompativel();
      return lista.map(c => this.validar(c));
    }));
  }

  buscar(id: number): Observable<ContaPagar> {
    return this.http.get<ContaPagar>(`${this.apiUrl}/buscar-contapagar/${id}`).pipe(map(c => this.validar(c)));
  }

  criar(conta: ContaPagarRequest): Observable<ContaPagar> {
    return this.http.post<ContaPagar>(`${this.apiUrl}/salvar-contapagar`, conta).pipe(map(c => this.validar(c)));
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletar-contapagar/${id}`);
  }

  atualizarConta(id: number, conta: ContaPagarRequest): Observable<ContaPagar> {
    return this.http.put<ContaPagar>(`${this.apiUrl}/atualizar-contapagar/${id}`, conta).pipe(map(c => this.validar(c)));
  }

  private validar(c: ContaPagar): ContaPagar {
    if (!c || !Number.isSafeInteger(c.id) || c.id <= 0 || typeof c.valorPago !== 'number' || !Number.isFinite(c.valorPago) ||
      typeof c.saldoRestante !== 'number' || !Number.isFinite(c.saldoRestante) || typeof c.pagamentoParcial !== 'boolean' ||
      !Array.isArray(c.avisos) || c.avisos.some(a => typeof a !== 'string')) throw this.incompativel();
    return c;
  }
  private incompativel(): HttpErrorResponse {
    return new HttpErrorResponse({ status: 502, error: { detail: 'O backend não retornou a posição financeira completa. Atualize a API antes de operar as contas.' } });
  }
}
