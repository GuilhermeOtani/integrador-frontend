import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ContaReceberService } from './conta-receber-service';
import { cobrancaFixture } from '../testing/receber.fixtures';

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
  it('usa os endpoints de CRUD com competência explícita e sem saldo/status editáveis', () => {
    const dados = { descricao: 'Mensalidade', valor: 300, dataVencimento: '2026-11-05', aluno: { id: 42 }, competencia: '2026-10' };
    service.criar(dados).subscribe(); const criar = http.expectOne(`${environment.apiUrl}/contareceber/salvar-contareceber`);
    expect(criar.request.method).toBe('POST'); expect(criar.request.body).toEqual(dados); criar.flush(cobrancaFixture());
    service.atualizar(1, dados).subscribe(); const editar = http.expectOne(`${environment.apiUrl}/contareceber/atualizar-contareceber/1`);
    expect(editar.request.method).toBe('PUT'); expect(editar.request.body).toEqual(dados); editar.flush(cobrancaFixture());
    service.buscar(1).subscribe(); const buscar = http.expectOne(`${environment.apiUrl}/contareceber/buscar-contareceber/1`); expect(buscar.request.method).toBe('GET'); buscar.flush(cobrancaFixture());
    service.excluir(1).subscribe(); const excluir = http.expectOne(`${environment.apiUrl}/contareceber/deletar-contareceber/1`); expect(excluir.request.method).toBe('DELETE'); excluir.flush(null);
  });
  it('recusa resposta antiga sem posição financeira em vez de inventar saldo', () => {
    let status = 0; service.listarMinhas().subscribe({ error: e => status = e.status });
    http.expectOne(`${environment.apiUrl}/contareceber/minhas`).flush([{ id: 1, valor: 300 }]); expect(status).toBe(502);
  });
});
