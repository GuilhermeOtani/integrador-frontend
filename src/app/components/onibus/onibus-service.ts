import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class OnibusService {

  
  private urlUsuario: string = "http://localhost:8080/onibus";


  constructor(private httpCliente: HttpClient) {}

  listarOnibus(): Observable<any[]> {
    return this.httpCliente.get<any[]>(`${this.urlUsuario}/listar`);
  }

  CadastroOnibus(Onibus: any): Observable<any> {
    return this.httpCliente.post<any>(`${this.urlUsuario}/salvar-onibus`, Onibus);
  }

  ExcluirOnibus(id: string | number):Observable<void>{
    return this.httpCliente.delete<any>(`${this.urlUsuario}/deletar-onibus/${id}`);
  }

  EditarOnibus(Onibus:any):Observable<any>{
    return this.httpCliente.put<any>(`${this.urlUsuario}/atualizar-onibus/${Onibus.id}`,Onibus);
  }

}