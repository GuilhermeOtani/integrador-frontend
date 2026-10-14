import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminDashboard, AlunoDashboard, MotoristaDashboard } from '../models/dashboard.models';
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/dashboard`;
  aluno() { return this.http.get<AlunoDashboard>(`${this.url}/aluno`); }
  motorista() { return this.http.get<MotoristaDashboard>(`${this.url}/motorista`); }
  admin(mes?: string) {
    const params = mes === undefined ? new HttpParams() : new HttpParams().set('mes', mes);
    return this.http.get<AdminDashboard>(`${this.url}/admin`, { params });
  }
}
