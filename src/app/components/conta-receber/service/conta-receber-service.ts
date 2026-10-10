import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ContaReceber } from '../models/conta-receber';

@Injectable({ providedIn: 'root' })
export class ContaReceberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/contareceber`;

  listarTodas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/listar`);
  }

  listarMinhas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/minhas`);
  }
}
