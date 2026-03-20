import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AlunoService {

  
  private urlUsuario: string = "http://localhost:8080/aluno";


  constructor(private httpCliente: HttpClient) {}

  listarAlunos(): Observable<any[]> {
    return this.httpCliente.get<any[]>(`${this.urlUsuario}/listar`);
  }

  CadastroAlunos(aluno: any): Observable<any> {
    return this.httpCliente.post<any>(`${this.urlUsuario}/salvar-aluno`, aluno);
  }

  ExcluirAlunos(id: string | number):Observable<void>{
    return this.httpCliente.delete<any>(`${this.urlUsuario}/deletar-aluno/${id}`);
  }

  EditarAlunos(aluno:any):Observable<any>{
    return this.httpCliente.put<any>(`${this.urlUsuario}/atualizar-aluno/${aluno.id}`,aluno);
  }

}