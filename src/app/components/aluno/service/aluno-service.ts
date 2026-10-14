import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Aluno, { SituacaoExclusaoAluno, SituacaoListaAluno } from '../models/aluno';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlunoService {

  
  private readonly urlUsuario = `${environment.apiUrl}/aluno`;


  constructor(private httpCliente: HttpClient) {}

  listarAlunos(situacao: SituacaoListaAluno = 'NAO_ARQUIVADOS'): Observable<Aluno[]> {
    return this.httpCliente.get<Aluno[]>(`${this.urlUsuario}/listar`, { params: { situacao } });
  }

  atualizarArquivamento(id: number, arquivado: boolean): Observable<Aluno> {
    return this.httpCliente.patch<Aluno>(`${this.urlUsuario}/${id}/arquivamento`, { arquivado });
  }

  consultarSituacaoExclusao(id: number): Observable<SituacaoExclusaoAluno> {
    return this.httpCliente.get<SituacaoExclusaoAluno>(`${this.urlUsuario}/${id}/situacao-exclusao`);
  }

  CadastroAlunos(aluno: Aluno): Observable<Aluno> {
    return this.httpCliente.post<Aluno>(`${this.urlUsuario}/salvar-aluno`, this.dadosCadastro(aluno));
  }

  ExcluirAlunos(id: string | number):Observable<void>{
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-aluno/${id}`);
  }

  EditarAlunos(aluno:Aluno):Observable<Aluno>{
    return this.httpCliente.put<Aluno>(`${this.urlUsuario}/atualizar-aluno/${aluno.id}`, this.dadosCadastro(aluno));
  }

  private dadosCadastro(aluno: Aluno) {
    return {
      nome: aluno.nome,
      cpfCnpj: aluno.cpfCnpj,
      telefone: aluno.telefone,
      matricula: aluno.matricula,
      mensalidade: aluno.mensalidade,
      faculdadeId: aluno.faculdadeId,
    };
  }

}
