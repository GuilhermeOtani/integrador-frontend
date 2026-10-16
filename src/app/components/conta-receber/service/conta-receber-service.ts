import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { posicaoReceberValida } from '../utils/conta-receber.utils';
import { environment } from '../../../../environments/environment';
import { ContaReceber, ContaReceberRequest } from '../models/conta-receber';

@Injectable({ providedIn: 'root' })
export class ContaReceberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/contareceber`;

  listarTodas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/listar`).pipe(map(lista => this.validarLista(lista)));
  }

  listarMinhas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/minhas`).pipe(map(lista => this.validarLista(lista)));
  }
  buscar(id: number): Observable<ContaReceber> {
    return this.http.get<ContaReceber>(`${this.apiUrl}/buscar-contareceber/${id}`).pipe(map(c => this.validar(c)));
  }
  criar(conta: ContaReceberRequest): Observable<ContaReceber> {
    return this.http.post<ContaReceber>(`${this.apiUrl}/salvar-contareceber`, conta).pipe(map(c => this.validar(c)));
  }
  atualizar(id: number, conta: ContaReceberRequest): Observable<ContaReceber> {
    return this.http.put<ContaReceber>(`${this.apiUrl}/atualizar-contareceber/${id}`, conta).pipe(map(c => this.validar(c)));
  }
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletar-contareceber/${id}`);
  }
  private validarLista(lista: ContaReceber[]): ContaReceber[] {
    if (!Array.isArray(lista)) throw this.incompativel();
    return lista.map(c => this.validar(c));
  }
  private validar(c: ContaReceber): ContaReceber {
    if (!posicaoReceberValida(c)) throw this.incompativel();
    return c;
  }
  private incompativel(): HttpErrorResponse {
    return new HttpErrorResponse({ status: 502, error: { detail: 'O backend não retornou a posição completa da cobrança. Atualize a API antes de operar as mensalidades.' } });
  }
}
