import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Faculdade from './model/faculdade';

@Injectable({
  providedIn: 'root',
})
export class FaculdadeService {
   
  private urlUsuario: string = "http://localhost:8080/faculdade";


  constructor(private httpCliente: HttpClient) {}

  listarFaculdades(): Observable<Faculdade[]> {
    return this.httpCliente.get<Faculdade[]>(`${this.urlUsuario}/listar`);
  }

  CadastroFaculdades(faculdade: Faculdade): Observable<Faculdade> {
    return this.httpCliente.post<Faculdade>(`${this.urlUsuario}/salvar-faculdade`, faculdade);
  }

  ExcluirFaculdades(id: string | number):Observable<void>{
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-faculdade/${id}`);
  }

  EditarFaculdades(faculdade: Faculdade):Observable<Faculdade>{
    return this.httpCliente.put<Faculdade>(`${this.urlUsuario}/atualizar-faculdade/${faculdade.id}`,faculdade);
  }

}
