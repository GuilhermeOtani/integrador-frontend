import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import GradeDiaria  from '../grade-diaria/model/grade-diaria';

@Injectable({
  providedIn: 'root'
})
export class GradeDiariaService {
  
  private apiUrl = 'http://localhost:8080/grade-diaria';

  constructor(private http: HttpClient) { }

  listarTodasGrades(): Observable<GradeDiaria[]> {
    return this.http.get<GradeDiaria[]>(`${this.apiUrl}/listar`);
  }

  salvarGrade(grade: GradeDiaria): Observable<GradeDiaria> {
    return this.http.post<GradeDiaria>(`${this.apiUrl}/salvar-grade`, grade);
  }

  buscarGradePorId(id: number): Observable<GradeDiaria> {
    return this.http.get<GradeDiaria>(`${this.apiUrl}/buscar-grade/${id}`);
  }

  atualizarGrade(id: number, grade: GradeDiaria): Observable<GradeDiaria> {
    return this.http.put<GradeDiaria>(`${this.apiUrl}/atualizar-grade/${id}`, grade);
  }

  deletarGradePorId(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletar-grade/${id}`);
  }
}