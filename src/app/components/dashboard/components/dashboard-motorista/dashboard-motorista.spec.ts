import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardMotorista } from './dashboard-motorista';
import { motoristaFixture } from '../../testing/dashboard.fixtures';
import { environment } from '../../../../../environments/environment';

describe('DashboardMotorista', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DashboardMotorista], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }));
  it('mostra escala, itinerário e atalhos sem financeiro administrativo', () => {
    const fixture = TestBed.createComponent(DashboardMotorista); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/dashboard/motorista`).flush(motoristaFixture); fixture.detectChanges();
    for (const texto of ['João', 'ABC1234', 'Praça', 'Faculdade A', 'Faculdade B']) expect(fixture.nativeElement.textContent).toContain(texto);
    expect(fixture.nativeElement.querySelector('a[href="/minhas-viagens"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/contapagar"]')).toBeNull(); http.verify();
  });
  it('resposta vazia mostra estado específico e não consulta outros endpoints', () => {
    const fixture = TestBed.createComponent(DashboardMotorista); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/dashboard/motorista`).flush({ ...motoristaFixture, transporte: { viagensHoje: [], agendaSemanal: [], programacaoSemGrade: [], rotas: [] }, avisos: ['Nenhuma atribuição.'] });
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Nenhuma viagem programada para hoje.');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma atribuição.'); http.verify();
  });
});
