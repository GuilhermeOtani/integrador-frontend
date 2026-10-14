import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DashboardService } from './dashboard-service';
import { adminFixture, alunoFixture, motoristaFixture } from '../testing/dashboard.fixtures';

describe('DashboardService', () => {
  let http: HttpTestingController;
  let service: DashboardService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(DashboardService);
  });
  afterEach(() => http.verify());
  it('consulta aluno sem identidade ou outros parâmetros', () => {
    service.aluno().subscribe(dados => expect(dados).toEqual(alunoFixture));
    const req = http.expectOne(`${environment.apiUrl}/dashboard/aluno`);
    expect(req.request.method).toBe('GET'); expect(req.request.params.keys()).toEqual([]);
    req.flush(alunoFixture);
  });
  it('consulta motorista sem identidade', () => {
    service.motorista().subscribe(); const req = http.expectOne(`${environment.apiUrl}/dashboard/motorista`);
    expect(req.request.method).toBe('GET'); expect(req.request.params.keys()).toEqual([]); req.flush(motoristaFixture);
  });
  it('deixa o backend escolher o mês na primeira consulta', () => {
    service.admin().subscribe(); const req = http.expectOne(`${environment.apiUrl}/dashboard/admin`);
    expect(req.request.method).toBe('GET'); expect(req.request.params.keys()).toEqual([]); req.flush(adminFixture);
  });
  it('envia somente mes ao consultar movimentações', () => {
    service.admin('2026-09').subscribe(); const req = http.expectOne(`${environment.apiUrl}/dashboard/admin?mes=2026-09`);
    expect(req.request.params.keys()).toEqual(['mes']); req.flush(adminFixture);
  });
});
