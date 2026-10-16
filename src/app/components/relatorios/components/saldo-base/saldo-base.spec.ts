import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SaldoBaseEditor } from './saldo-base';
import { environment } from '../../../../../environments/environment';
import { baseFixture } from '../../testing/relatorios.fixtures';
describe('SaldoBaseEditor', () => {
  let fixture: ComponentFixture<SaldoBaseEditor>; let c: SaldoBaseEditor; let http: HttpTestingController; const url = `${environment.apiUrl}/financeiro/saldo-base`;
  beforeEach(() => { TestBed.configureTestingModule({ imports: [SaldoBaseEditor], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }); http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(SaldoBaseEditor); c = fixture.componentInstance; fixture.detectChanges(); });
  afterEach(() => { fixture.destroy(); http.verify({ ignoreCancelled: true }); });
  it('404 do saldo abre primeiro cadastro com versão null e aceita valor negativo', () => {
    http.expectOne(url).flush({}, { status: 404, statusText: 'Not Found' }); expect(c.visivel).toBeTrue(); expect(c.conhecido()).toBeTrue();
    c.form.setValue({ dataReferencia: '2026-10-01', saldo: -123.45 }); c.salvar(); const r = http.expectOne(url); expect(r.request.body).toEqual({ dataReferencia: '2026-10-01', saldo: -123.45, versao: null }); r.flush({ ...baseFixture, saldo: -123.45 }); expect(c.visivel).toBeFalse();
  });
  it('edição envia versão zero sem converter para null', () => {
    http.expectOne(url).flush(baseFixture); c.abrir(); c.form.controls.saldo.setValue(0); c.salvar(); const r = http.expectOne(url); expect(r.request.body.versao).toBe(0); r.flush({ ...baseFixture, saldo: 0, versao: 1 }); expect(c.base()?.versao).toBe(1);
  });
  it('conflito carrega versão atual e exige revisão, sem repetir PUT', () => {
    http.expectOne(url).flush(baseFixture); c.abrir(); c.form.controls.saldo.setValue(500); c.salvar(); http.expectOne(url).flush({}, { status: 409, statusText: 'Conflict' });
    const leitura = http.expectOne(url); expect(leitura.request.method).toBe('GET'); leitura.flush({ ...baseFixture, saldo: 900, versao: 2 });
    expect(c.form.controls.saldo.value).toBe(900); expect(c.aviso()).toContain('revise'); http.expectNone(r => r.method === 'PUT');
  });
  it('falha na recuperação do conflito impede salvar com versão antiga', () => {
    http.expectOne(url).flush(baseFixture); c.abrir(); c.salvar(); http.expectOne(url).flush({}, { status: 409, statusText: 'Conflict' }); http.expectOne(url).flush({}, { status: 500, statusText: 'Erro' });
    c.salvar(); expect(c.conhecido()).toBeFalse(); http.expectNone(r => r.method === 'PUT');
  });
  it('500 não oferece primeiro cadastro e não permite salvar', () => {
    http.expectOne(url).flush({}, { status: 500, statusText: 'Erro' }); expect(c.visivel).toBeFalse(); c.form.setValue({ dataReferencia: '2026-10-01', saldo: 500 }); c.salvar(); http.expectNone(r => r.method === 'PUT');
  });
  it('datas inválidas e frações de centavo bloqueiam gravação', () => {
    http.expectOne(url).flush(baseFixture); c.abrir(); c.form.setValue({ dataReferencia: '2026-02-29', saldo: 1 }); c.salvar(); expect(c.form.invalid).toBeTrue();
    c.form.setValue({ dataReferencia: '2026-10-01', saldo: 1.001 }); c.salvar(); expect(c.form.invalid).toBeTrue(); http.expectNone(r => r.method === 'PUT');
  });
  it('duplo clique grava apenas uma vez e emite saldo salvo', () => {
    http.expectOne(url).flush(baseFixture); c.abrir(); const spy = jasmine.createSpy(); c.salvo.subscribe(spy); c.salvar(); c.salvar(); http.expectOne(url).flush(baseFixture); expect(spy).toHaveBeenCalledOnceWith(baseFixture);
  });
});
