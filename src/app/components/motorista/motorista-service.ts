import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MotoristaService {

  
  private urlUsuario: string = "http://localhost:8080/motorista";


  constructor(private httpCliente: HttpClient) {}

  listarMotoristas(): Observable<any[]> {
    return this.httpCliente.get<any[]>(`${this.urlUsuario}/listar`);
  }

  CadastroMotoristas(motorista: any): Observable<any> {
    return this.httpCliente.post<any>(`${this.urlUsuario}/salvar-motorista`, motorista);
  }

  ExcluirMotoristas(id: string | number):Observable<void>{
    return this.httpCliente.delete<any>(`${this.urlUsuario}/deletar-motorista/${id}`);
  }

  EditarMotoristas(motorista:any):Observable<any>{
    return this.httpCliente.put<any>(`${this.urlUsuario}/atualizar-motorista/${motorista.id}`,motorista);
  }

}