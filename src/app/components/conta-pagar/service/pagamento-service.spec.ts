import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PagamentoService } from './pagamento-service';
import { environment } from '../../../../environments/environment';
describe('PagamentoService', () => {
  let api: PagamentoService; let http: HttpTestingController; const base = `${environment.apiUrl}/pagamentos`;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(PagamentoService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('envia valor parcial e Idempotency-Key sem corpo nem status manual', () => {
    api.realizarPagamento(123, 'PIX', 600, 'chave').subscribe(); const r = http.expectOne(`${base}/realizar/123?formaPagamento=PIX&valorPago=600`);
    expect(r.request.method).toBe('POST'); expect(r.request.body).toBeNull(); expect(r.request.headers.get('Idempotency-Key')).toBe('chave'); r.flush({});
  });
  it('preserva omissão do valor para repetição de intenção de saldo restante', () => {
    api.realizarPagamento(123, 'DINHEIRO', undefined, 'mesma-chave').subscribe(); const r = http.expectOne(`${base}/realizar/123?formaPagamento=DINHEIRO`);
    expect(r.request.params.has('valorPago')).toBeFalse(); expect(r.request.headers.get('Idempotency-Key')).toBe('mesma-chave'); r.flush({});
  });
  it('comprovantes preservam endpoint de recibo antigo e lista nova', () => {
    api.buscarReciboPorConta(123).subscribe(); http.expectOne(`${base}/recibo/conta/123`).flush({});
    api.listarPorConta(123).subscribe(r => expect(r).toEqual([])); http.expectOne(`${base}/conta/123`).flush([]);
  });
});
