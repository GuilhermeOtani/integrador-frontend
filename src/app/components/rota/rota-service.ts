import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import rota from './model/rota';

@Injectable({
  providedIn: 'root',
})
export class RotaService {
  private urlUsuario: string = 'http://localhost:8080/rota';

  constructor(private httpCliente: HttpClient) {}

  listarTodasRotas(): Observable<rota[]> {
    return this.httpCliente.get<rota[]>(`${this.urlUsuario}/listar`);
  }

  salvarRota(Rota: rota): Observable<rota> {
    return this.httpCliente.post<rota>(`${this.urlUsuario}/salvar-rota`, Rota);
  }

  deletarRotaPorId(id: string | number): Observable<void> {
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-rota/${id}`);
  }

  atualizarRota(id: number, rotaAtualizada: rota) {
    return this.httpCliente.put<rota>(`${this.urlUsuario}/${id}`, rotaAtualizada); 
  }
}
