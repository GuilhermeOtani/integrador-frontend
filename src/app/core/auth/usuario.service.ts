import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CriarAdminRequest,
  CriarUsuarioRequest,
  PessoaDisponivelResponse,
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
}
