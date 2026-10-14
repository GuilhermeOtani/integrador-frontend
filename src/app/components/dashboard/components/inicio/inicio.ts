import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { DashboardAluno } from '../dashboard-aluno/dashboard-aluno';
import { DashboardMotorista } from '../dashboard-motorista/dashboard-motorista';
import { DashboardAdmin } from '../dashboard-admin/dashboard-admin';
@Component({
  selector: 'app-inicio', standalone: true, imports: [DashboardAluno, DashboardMotorista, DashboardAdmin],
  template: `@switch (auth.papel()) {
  @case ('ALUNO') { <app-dashboard-aluno /> }
  @case ('MOTORISTA') { <app-dashboard-motorista /> }
  @case ('ADMIN') { <app-dashboard-admin /> }
  @default { <p>Sessão indisponível. Entre novamente.</p> }
 }`,
})
export class Inicio {
  readonly auth = inject(AuthService);
}
