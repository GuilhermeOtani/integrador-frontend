import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { Papel } from '../../../../core/auth/models/auth.models';
import { environment } from '../../../../../environments/environment';
import { Inicio } from './inicio';
import { adminFixture, alunoFixture, motoristaFixture } from '../../testing/dashboard.fixtures';

describe('Inicio', () => {
  for (const papel of ['ALUNO', 'MOTORISTA', 'ADMIN'] as Papel[]) {
    it(`instancia e consulta somente ${papel}`, () => {
      TestBed.configureTestingModule({ imports: [Inicio], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(), MessageService,
        { provide: AuthService, useValue: { papel: () => papel, usuario: () => null } }] });
      const fixture = TestBed.createComponent(Inicio); fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      const consultas = http.match(req => req.url.startsWith(`${environment.apiUrl}/dashboard`));
      expect(consultas.length).toBe(1); expect(consultas[0].request.url).toBe(`${environment.apiUrl}/dashboard/${papel.toLowerCase()}`);
      consultas[0].flush(papel === 'ALUNO' ? alunoFixture : papel === 'MOTORISTA' ? motoristaFixture : adminFixture);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('app-dashboard-aluno, app-dashboard-motorista, app-dashboard-admin').length).toBe(1);
      http.verify();
    });
  }
  it('sessão ausente não instancia nenhum dashboard', () => {
    TestBed.configureTestingModule({ imports: [Inicio], providers: [{ provide: AuthService, useValue: { papel: () => null } }] });
    const fixture = TestBed.createComponent(Inicio); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sessão indisponível');
    expect(fixture.nativeElement.querySelector('app-dashboard-aluno')).toBeNull();
  });
});
