import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Onibus from './model/onibus';

@Injectable({
  providedIn: 'root',
})
export class OnibusService {
  private urlUsuario: string = 'http://localhost:8080/onibus';

  constructor(private httpCliente: HttpClient) {}

  listarOnibus(): Observable<Onibus[]> {
    return this.httpCliente.get<Onibus[]>(`${this.urlUsuario}/listar`);
  }

  CadastroOnibus(Onibus: Onibus): Observable<Onibus> {
    return this.httpCliente.post<Onibus>(`${this.urlUsuario}/salvar-onibus`, Onibus);
  }

  ExcluirOnibus(id: string | number): Observable<void> {
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-onibus/${id}`);
  }

  EditarOnibus(Onibus: Onibus): Observable<Onibus> {
    return this.httpCliente.put<Onibus>(`${this.urlUsuario}/atualizar-onibus/${Onibus.id}`, Onibus);
  }
}
