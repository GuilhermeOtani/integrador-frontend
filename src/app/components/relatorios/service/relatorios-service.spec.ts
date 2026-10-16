import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { baixarPdf, mensagemErroDownload, RelatoriosService } from './relatorios-service';
import { baseFixture } from '../testing/relatorios.fixtures';
describe('RelatoriosService', () => {
  let api: RelatoriosService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(RelatoriosService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  for (const tipo of ['inadimplencia', 'fluxo-caixa', 'acerto-motoristas'] as const) {
    it(`${tipo}: JSON e PDF usam os mesmos filtros`, () => {
      const filtro = tipo === 'inadimplencia' ? { alunoId: 7, vencimentoInicio: '2026-10-01', vencimentoFim: '2026-10-31' } : tipo === 'fluxo-caixa' ? { dataInicio: '2026-10-01', dataFim: '2026-10-31' } : { mes: '2026-10', motoristaId: 42 };
      if (tipo === 'inadimplencia') api.inadimplencia(filtro).subscribe();
      else if (tipo === 'fluxo-caixa') api.fluxo({ dataInicio: '2026-10-01', dataFim: '2026-10-31' }).subscribe();
      else api.acerto({ mes: '2026-10', motoristaId: 42 }).subscribe();
      api.pdf(tipo, filtro).subscribe();
      const json = http.expectOne(r => r.url === `${environment.apiUrl}/relatorios/${tipo}`);
      const pdf = http.expectOne(r => r.url === `${environment.apiUrl}/relatorios/${tipo}/pdf`);
      expect(json.request.params.toString()).toBe(pdf.request.params.toString()); expect(pdf.request.responseType).toBe('blob'); expect(pdf.request.method).toBe('GET');
      json.flush({}); pdf.flush(new Blob(['%PDF'], { type: 'application/pdf' }));
    });
  }
  it('omite opcionais ausentes, vazios e zero', () => {
    api.pdf('inadimplencia', { alunoId: 0, vencimentoInicio: '', vencimentoFim: undefined, outro: null }).subscribe();
    const r = http.expectOne(`${environment.apiUrl}/relatorios/inadimplencia/pdf`); expect(r.request.params.keys()).toEqual([]); r.flush(new Blob(['pdf']));
  });
  it('saldo base preserva versão e aceita saldo negativo', () => {
    api.saldoBase().subscribe(); http.expectOne(`${environment.apiUrl}/financeiro/saldo-base`).flush(baseFixture);
    api.salvarSaldoBase({ dataReferencia: '2026-10-01', saldo: -123.45, versao: 0 }).subscribe();
    const r = http.expectOne(`${environment.apiUrl}/financeiro/saldo-base`); expect(r.request.method).toBe('PUT'); expect(r.request.body.versao).toBe(0); expect(r.request.body.saldo).toBe(-123.45); r.flush(baseFixture);
  });
  it('download usa nome sanitizado e libera a URL', fakeAsync(() => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:teste'); const revogar = spyOn(URL, 'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function(this: HTMLAnchorElement) { expect(this.download).toBe('relatorio_outubro.pdf'); });
    baixarPdf(new HttpResponse({ body: new Blob(['pdf']), headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="relatorio/outubro.pdf"' }) }));
    expect(click).toHaveBeenCalledTimes(1); expect(document.querySelector('a[href="blob:teste"]')).toBeNull(); tick(1000); expect(revogar).toHaveBeenCalledWith('blob:teste');
  }));
  it('download aceita filename UTF-8 e nome padrão', fakeAsync(() => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:teste'); spyOn(URL, 'revokeObjectURL');
    const nomes: string[] = []; spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function(this: HTMLAnchorElement) { nomes.push(this.download); });
    baixarPdf(new HttpResponse({ body: new Blob(['pdf']), headers: new HttpHeaders({ 'Content-Disposition': "attachment; filename*=UTF-8''acerto%20Jos%C3%A9.pdf" }) }));
    baixarPdf(new HttpResponse({ body: new Blob(['pdf']) })); expect(nomes).toEqual(['acerto José.pdf', 'relatorio.pdf']); tick(1000);
  }));
  it('arquivo ausente ou de zero bytes não é baixado', () => {
    expect(() => baixarPdf(new HttpResponse<Blob>())).toThrow(); expect(() => baixarPdf(new HttpResponse({ body: new Blob([]) }))).toThrow();
  });
  it('converte ProblemDetail Blob sem exibir HTML ilegível', async () => {
    expect(await mensagemErroDownload(new HttpErrorResponse({ status: 400, error: new Blob([JSON.stringify({ detail: 'Período inválido.' })]) }))).toBe('Período inválido.');
    expect(await mensagemErroDownload(new HttpErrorResponse({ status: 500, error: new Blob(['<html>erro</html>']) }))).toContain('Não foi possível');
    expect(await mensagemErroDownload(new HttpErrorResponse({ status: 403, error: new Blob(['{}']) }))).toContain('permissão');
    expect(await mensagemErroDownload(new HttpErrorResponse({ status: 0 }))).toContain('Servidor indisponível');
  });
});
