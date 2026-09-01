import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Onibus from './model/onibus';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OnibusService {
  private readonly urlUsuario = `${environment.apiUrl}/onibus`;

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
