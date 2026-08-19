import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Aluno from '../aluno/model/aluno';

@Injectable({
  providedIn: 'root'
})
export class AlunoService {

  
  private urlUsuario: string = "http://localhost:8080/aluno";


  constructor(private httpCliente: HttpClient) {}

  listarAlunos(): Observable<Aluno[]> {
    return this.httpCliente.get<Aluno[]>(`${this.urlUsuario}/listar`);
  }

  CadastroAlunos(aluno: Aluno): Observable<Aluno> {
    return this.httpCliente.post<Aluno>(`${this.urlUsuario}/salvar-aluno`, aluno);
  }

  ExcluirAlunos(id: string | number):Observable<void>{
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-aluno/${id}`);
  }

  EditarAlunos(aluno:Aluno):Observable<Aluno>{
    return this.httpCliente.put<Aluno>(`${this.urlUsuario}/atualizar-aluno/${aluno.id}`,aluno);
  }

}