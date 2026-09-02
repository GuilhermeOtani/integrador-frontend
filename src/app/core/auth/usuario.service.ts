import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AtualizarEmailUsuarioRequest,
  AtualizarStatusUsuarioRequest,
  CriarAdminRequest,
  CriarUsuarioRequest,
  PessoaDisponivelResponse,
  RedefinirSenhaUsuarioRequest,
  UsuarioResumo,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<UsuarioResumo[]> {
    return this.http.get<UsuarioResumo[]>(this.apiUrl);
  }

  listarPessoasSemUsuario(): Observable<PessoaDisponivelResponse[]> {
    return this.http.get<PessoaDisponivelResponse[]>(`${this.apiUrl}/pessoas-sem-usuario`);
  }

  criar(request: CriarUsuarioRequest): Observable<UsuarioResumo> {
    return this.http.post<UsuarioResumo>(this.apiUrl, request);
  }

  criarAdmin(request: CriarAdminRequest): Observable<UsuarioResumo> {
    return this.http.post<UsuarioResumo>(`${this.apiUrl}/admin`, request);
  }

  atualizarEmail(id: number, email: string): Observable<UsuarioResumo> {
    const request: AtualizarEmailUsuarioRequest = { email: email.trim() };
    return this.http.patch<UsuarioResumo>(`${this.apiUrl}/${id}`, request);
  }

  redefinirSenha(id: number, senha: string): Observable<void> {
    const request: RedefinirSenhaUsuarioRequest = { senha };
    return this.http.put<void>(`${this.apiUrl}/${id}/senha`, request);
  }

  atualizarStatus(id: number, ativo: boolean): Observable<UsuarioResumo> {
    const request: AtualizarStatusUsuarioRequest = { ativo };
    return this.http.patch<UsuarioResumo>(`${this.apiUrl}/${id}/status`, request);
  }

  excluirAcesso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
