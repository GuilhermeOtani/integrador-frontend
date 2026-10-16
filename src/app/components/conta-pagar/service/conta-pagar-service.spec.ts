import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContaPagarService } from './conta-pagar-service';
import { environment } from '../../../../environments/environment';
import { contaFixture } from '../../relatorios/testing/relatorios.fixtures';
import { ContaPagarRequest } from '../../relatorios/models/relatorios.models';
describe('ContaPagarService', () => {
  let api: ContaPagarService; let http: HttpTestingController; const base = `${environment.apiUrl}/contapagar`;
  const dados: ContaPagarRequest = { descricao: 'Despesa', valor: 100, dataVencimento: '2026-10-31', competencia: '2026-10', classificacao: 'DESPESA', motorista: null };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(ContaPagarService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('lista e consulta a posição completa fornecida pelo backend', () => {
    api.listarTodas().subscribe(r => expect(r[0].saldoRestante).toBe(2400)); http.expectOne(`${base}/listar`).flush([contaFixture()]);
    api.buscar(123).subscribe(r => expect(r.pagamentoParcial).toBeTrue()); http.expectOne(`${base}/buscar-contapagar/123`).flush(contaFixture());
  });
  it('criação e edição enviam somente requisição tipada', () => {
    api.criar(dados).subscribe(); const novo = http.expectOne(`${base}/salvar-contapagar`); expect(novo.request.method).toBe('POST'); expect(novo.request.body).toEqual(dados); novo.flush(contaFixture());
    api.atualizarConta(123, dados).subscribe(); const editar = http.expectOne(`${base}/atualizar-contapagar/123`); expect(editar.request.method).toBe('PUT'); expect(editar.request.body.status).toBeUndefined(); editar.flush(contaFixture());
  });
  it('exclusão usa endpoint existente', () => { api.excluir(123).subscribe(); const r = http.expectOne(`${base}/deletar-contapagar/123`); expect(r.request.method).toBe('DELETE'); r.flush(null); });
  it('backend antigo sem posição financeira é rejeitado em vez de recalcular saldos', () => {
    api.listarTodas().subscribe({ next: () => fail('contrato incompatível'), error: e => expect(e.error.detail).toContain('posição financeira completa') });
    http.expectOne(`${base}/listar`).flush([{ id: 123, valor: 100, status: 'PENDENTE' }]);
  });
});
