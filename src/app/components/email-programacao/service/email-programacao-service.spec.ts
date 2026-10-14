import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { EmailProgramacaoService } from './email-programacao-service';
import { EMAIL_ID } from '../testing/email-programacao.fixtures';
describe('EmailProgramacaoService', () => {
  let api: EmailProgramacaoService; let http: HttpTestingController;
  const base = `${environment.apiUrl}/integracoes/email`;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(EmailProgramacaoService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta configuração sem identidade', () => { api.configuracao().subscribe(); const r = http.expectOne(`${base}/configuracao`); expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual([]); r.flush({}); });
  it('PUT envia somente a chave automática', () => { api.configurar(false).subscribe(); const r = http.expectOne(`${base}/configuracao`); expect(r.request.method).toBe('PUT'); expect(r.request.body).toEqual({ automatico: false }); r.flush({}); });
  it('prévia geral sem data, público ou usuário', () => { api.previa().subscribe(); const r = http.expectOne(`${base}/previa`); expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual([]); r.flush({}); });
  it('envio normal limita o contrato público, sem assunto/HTML/endereço/PDF', () => {
    api.enviar({ requestId: EMAIL_ID, reenviar: false, motivo: 'Não permitido', email: 'extra@example.com', html: '<p>Extra</p>' } as any).subscribe();
    const r = http.expectOne(`${base}/envios`); expect(r.request.method).toBe('POST'); expect(r.request.body).toEqual({ requestId: EMAIL_ID, reenviar: false }); r.flush({}, { status: 202, statusText: 'Accepted' });
  });
  it('correção envia reenviar e motivo, não reenvio', () => { api.enviar({ requestId: EMAIL_ID, reenviar: true, motivo: 'Troca do ônibus' }).subscribe(); const r = http.expectOne(`${base}/envios`); expect(r.request.body).toEqual({ requestId: EMAIL_ID, reenviar: true, motivo: 'Troca do ônibus' }); r.flush({}); });
  it('histórico inicial zero-based e vinte registros', () => { api.historico().subscribe(); const r = http.expectOne(`${base}/envios?pagina=0&tamanho=20`); expect(r.request.method).toBe('GET'); r.flush({}); });
  it('histórico com paginação real, até cem registros', () => { api.historico(3, 100).subscribe(); const r = http.expectOne(`${base}/envios?pagina=3&tamanho=100`); expect(r.request.params.get('tamanho')).toBe('100'); r.flush({}); });
  it('detalhe usa UUID codificado e nenhum destinatário', () => { api.detalhe('id/teste').subscribe(); const r = http.expectOne(`${base}/envios/id%2Fteste`); expect(r.request.method).toBe('GET'); r.flush({}); });
});
