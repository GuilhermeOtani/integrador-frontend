import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { RecebimentoService } from './recebimento-service';

describe('RecebimentoService', () => {
  let service: RecebimentoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecebimentoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('paga a cobrança enviando somente a forma de pagamento', () => {
    service.pagar(15, 'PIX').subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === `${environment.apiUrl}/recebimentos/realizar/15`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.params.keys()).toEqual(['formaPagamento']);
    expect(request.request.params.get('formaPagamento')).toBe('PIX');
    expect(request.request.params.has('valor')).toBeFalse();
    expect(request.request.params.has('valorPago')).toBeFalse();
    expect(request.request.params.has('alunoId')).toBeFalse();
    expect(request.request.params.has('pessoaId')).toBeFalse();
    request.flush({});
  });

  it('busca o recibo pela conta', () => {
    service.buscarRecibo(15).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/recebimentos/recibo/conta/15`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
  it('envia parcela, chave e nunca alunoId; mantém valor omitido nas repetições compatíveis', () => {
    service.pagar(15, 'PIX', 100.5, 'chave').subscribe();
    const req = http.expectOne(r => r.url.endsWith('/recebimentos/realizar/15'));
    expect(req.request.params.get('valorPago')).toBe('100.5'); expect(req.request.headers.get('Idempotency-Key')).toBe('chave');
    expect(req.request.params.has('alunoId')).toBeFalse(); req.flush({});
    service.pagar(15, 'PIX', undefined, 'mesma-chave').subscribe();
    const repeticao = http.expectOne(r => r.url.endsWith('/recebimentos/realizar/15'));
    expect(repeticao.request.params.has('valorPago')).toBeFalse(); expect(repeticao.request.headers.get('Idempotency-Key')).toBe('mesma-chave'); repeticao.flush({});
  });
  it('lista todos os recibos sem enviar identidade no histórico', () => {
    service.listarRecibos(15).subscribe(r => expect(r).toEqual([]));
    const req = http.expectOne(`${environment.apiUrl}/recebimentos/conta/15`); expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]); req.flush([]);
  });
});
