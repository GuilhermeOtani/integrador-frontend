import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { WhatsappService } from './whatsapp-service';

describe('WhatsappService', () => {
  let service: WhatsappService; let http: HttpTestingController;
  const pessoal = `${environment.apiUrl}/whatsapp`; const admin = `${environment.apiUrl}/integracoes/whatsapp`;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(WhatsappService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta assinatura sem identidade ou parâmetros', () => { service.minhaAssinatura().subscribe(); const r = http.expectOne(`${pessoal}/minha-assinatura`); expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual([]); r.flush({}); });
  it('ativação envia somente número e aceite', () => { service.solicitarAtivacao('+5511999999999', true).subscribe(); const r = http.expectOne(`${pessoal}/minha-assinatura/ativacao`); expect(r.request.method).toBe('POST'); expect(r.request.body).toEqual({ numero: '+5511999999999', aceite: true }); r.flush({}); });
  it('cancelamento pessoal usa DELETE sem corpo', () => { service.cancelar().subscribe(); const r = http.expectOne(`${pessoal}/minha-assinatura`); expect(r.request.method).toBe('DELETE'); expect(r.request.body).toBeNull(); r.flush(null); });
  it('PDF pessoal usa Blob sem identificação/token na URL', () => { service.meuPdf().subscribe(); const r = http.expectOne(`${pessoal}/minha-programacao/pdf`); expect(r.request.responseType).toBe('blob'); expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual([]); r.flush(new Blob()); });
  it('consulta e salva configuração sem segredos', () => { service.configuracao().subscribe(); http.expectOne(`${admin}/configuracao`).flush({}); service.configurarAutomatico(true).subscribe(); const r = http.expectOne(`${admin}/configuracao`); expect(r.request.method).toBe('PUT'); expect(r.request.body).toEqual({ automatico: true }); r.flush({}); });
  it('prévia e PDF usam somente usuarioId administrativo', () => { service.previa(2).subscribe(); const r = http.expectOne(`${admin}/previa?usuarioId=2`); expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual(['usuarioId']); r.flush({}); service.previaPdf(2).subscribe(); const pdf = http.expectOne(`${admin}/previa/pdf?usuarioId=2`); expect(pdf.request.responseType).toBe('blob'); pdf.flush(new Blob()); });
  it('envio mantém reenviar e não acrescenta data ou credenciais', () => { const dados = { requestId: 'uuid', publico: 'ALUNOS' as const, reenviar: true, motivo: 'Correção' }; service.enviar(dados).subscribe(); const r = http.expectOne(`${admin}/envios`); expect(r.request.method).toBe('POST'); expect(r.request.body).toEqual(dados); r.flush({}); });
  it('histórico pagina no servidor e detalhes codificam ID', () => { service.historico(2, 50).subscribe(); const r = http.expectOne(`${admin}/envios?pagina=2&tamanho=50`); expect(r.request.method).toBe('GET'); r.flush({}); service.lote('id/seguro').subscribe(); http.expectOne(`${admin}/envios/id%2Fseguro`).flush({}); });
});
