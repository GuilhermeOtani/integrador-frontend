import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PontoEmbarque } from './model/ponto-embarque';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PontoEmbarqueService {

  private readonly urlUsuario = `${environment.apiUrl}/ponto-embarque`;


  constructor(private httpCliente: HttpClient) {}

  listarPontoEmbarque(): Observable<PontoEmbarque[]> {
    return this.httpCliente.get<PontoEmbarque[]>(`${this.urlUsuario}/listar`);
  }

  CadastroPontoEmbarque(pontoEmbarque: PontoEmbarque): Observable<PontoEmbarque> {
    return this.httpCliente.post<PontoEmbarque>(`${this.urlUsuario}/salvar-pontoEmbarque`, pontoEmbarque);
  }

  ExcluirPontoEmbarque(id: string | number):Observable<void>{
    return this.httpCliente.delete<void>(`${this.urlUsuario}/deletar-pontoEmbarque/${id}`);
  }

  EditarPontoEmbarque(pontoEmbarque: PontoEmbarque):Observable<PontoEmbarque>{
    return this.httpCliente.put<PontoEmbarque>(`${this.urlUsuario}/atualizar-pontoEmbarque/${pontoEmbarque.id}`,pontoEmbarque);
  }
  
}
