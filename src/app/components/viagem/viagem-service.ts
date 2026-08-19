import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import Viagem from '../viagem/model/viagem';

@Injectable({
  providedIn: 'root',
})
export class ViagemService {
  private apiUrl = 'http://localhost:8080/viagem';

  constructor(private http: HttpClient) {}

  listarTodasViagens(): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/listar`);
  }

  salvarViagem(viagem: Viagem): Observable<Viagem> {
    return this.http.post<Viagem>(`${this.apiUrl}/salvar-viagem`, viagem);
  }

  buscarViagemPorId(id: number): Observable<Viagem> {
    return this.http.get<Viagem>(`${this.apiUrl}/buscar-viagem/${id}`);
  }

  atualizarViagem(id: number, viagem: Viagem): Observable<Viagem> {
    return this.http.put<Viagem>(`${this.apiUrl}/atualizar-viagem/${id}`, viagem);
  }

  deletarViagemPorId(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletar-viagem/${id}`);
  }
}
