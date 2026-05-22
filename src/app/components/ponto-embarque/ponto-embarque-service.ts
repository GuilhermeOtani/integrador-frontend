import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PontoEmbarqueService {

   private urlUsuario: string = "http://localhost:8080/ponto-embarque";


  constructor(private httpCliente: HttpClient) {}

  listarPontoEmbarque(): Observable<any[]> {
    return this.httpCliente.get<any[]>(`${this.urlUsuario}/listar`);
  }

  CadastroPontoEmbarque(pontoEmbarque: any): Observable<any> {
    return this.httpCliente.post<any>(`${this.urlUsuario}/salvar-pontoEmbarque`, pontoEmbarque);
  }

  ExcluirPontoEmbarque(id: string | number):Observable<void>{
    return this.httpCliente.delete<any>(`${this.urlUsuario}/deletar-pontoEmbarque/${id}`);
  }

  EditarPontoEmbarque(pontoEmbarque:any):Observable<any>{
    return this.httpCliente.put<any>(`${this.urlUsuario}/atualizar-pontoEmbarque/${pontoEmbarque.id}`,pontoEmbarque);
  }
  
}
