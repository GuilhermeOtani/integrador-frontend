import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Motorista from './model/motorista';


@Injectable({
  providedIn: 'root'
})
export class MotoristaService {

  
  private urlUsuario: string = "http://localhost:8080/motorista";


  constructor(private httpCliente: HttpClient) {}

  listarMotoristas(): Observable<Motorista[]> {
    return this.httpCliente.get<Motorista[]>(`${this.urlUsuario}/listar`);
  }

  CadastroMotoristas(motorista: Motorista): Observable<Motorista> {
    return this.httpCliente.post<Motorista>(`${this.urlUsuario}/salvar-motorista`, motorista);
  }

  ExcluirMotoristas(id: string | number):Observable<void>{
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-motorista/${id}`);
  }

  EditarMotoristas(motorista: Motorista):Observable<Motorista>{
    return this.httpCliente.put<Motorista>(`${this.urlUsuario}/atualizar-motorista/${motorista.id}`,motorista);
  }

}