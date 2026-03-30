import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FaculdadeService {
   
  private urlUsuario: string = "http://localhost:8080/faculdade";


  constructor(private httpCliente: HttpClient) {}

  listarFaculdades(): Observable<any[]> {
    return this.httpCliente.get<any[]>(`${this.urlUsuario}/listar`);
  }

  CadastroFaculdades(faculdade: any): Observable<any> {
    return this.httpCliente.post<any>(`${this.urlUsuario}/salvar-faculdade`, faculdade);
  }

  ExcluirFaculdades(id: string | number):Observable<void>{
    return this.httpCliente.delete<any>(`${this.urlUsuario}/deletar-faculdade/${id}`);
  }

  EditarFaculdades(faculdade:any):Observable<any>{
    return this.httpCliente.put<any>(`${this.urlUsuario}/atualizar-faculdade/${faculdade.id}`,faculdade);
  }

}
