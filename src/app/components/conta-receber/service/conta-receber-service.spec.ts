import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ContaReceberService } from './conta-receber-service';

describe('ContaReceberService', () => {
  let service: ContaReceberService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContaReceberService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista todas as contas para a consulta administrativa', () => {
    service.listarTodas().subscribe((contas) => expect(contas).toEqual([]));

    const request = http.expectOne(`${environment.apiUrl}/contareceber/listar`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });

  it('lista somente as cobranças do aluno autenticado', () => {
    service.listarMinhas().subscribe((contas) => expect(contas).toEqual([]));

    const request = http.expectOne(`${environment.apiUrl}/contareceber/minhas`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });
});
