import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../../../environments/environment';
import { assinaturaFixture } from '../../testing/whatsapp.fixtures';
import { AssinaturaWhatsappComponent } from './assinatura-whatsapp';

describe('AssinaturaWhatsappComponent', () => {
  let fixture: ComponentFixture<AssinaturaWhatsappComponent>; let http: HttpTestingController;
  const api = `${environment.apiUrl}/whatsapp`; const assinaturaUrl = `${api}/minha-assinatura`;
  const pendente = () => ({ ...assinaturaFixture, numero: '+5511999999999', status: 'PENDENTE' as const, codigoExpiraEm: new Date(Date.now() + 1_800_000).toISOString() });
  beforeEach(() => { TestBed.configureTestingModule({ imports: [AssinaturaWhatsappComponent], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }); http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(AssinaturaWhatsappComponent); fixture.detectChanges(); });
  afterEach(() => { fixture.destroy(); http.verify(); });
  it('aceite começa desmarcado e impede ativação sem consentimento', () => {
    http.expectOne(assinaturaUrl).flush(assinaturaFixture); fixture.detectChanges();
    fixture.componentInstance.form.controls.numero.setValue('+5511999999999'); fixture.componentInstance.solicitar();
    expect(fixture.componentInstance.form.controls.aceite.value).toBeFalse();
    http.expectNone(`${assinaturaUrl}/ativacao`); expect(fixture.nativeElement.textContent).toContain('Receber pelo WhatsApp');
  });
  it('normaliza telefone, bloqueia duplo envio e mantém pendente mesmo com link', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush(assinaturaFixture);
    const c = fixture.componentInstance; c.form.setValue({ numero: '+55 (11) 99999-9999', aceite: true }); c.solicitar(); c.solicitar();
    const req = http.expectOne(`${assinaturaUrl}/ativacao`); expect(req.request.body).toEqual({ numero: '+5511999999999', aceite: true });
    const link = 'https://wa.me/5511888888888?text=ATIVAR%20teste'; req.flush({ assinatura: pendente(), linkAtivacao: link }); fixture.detectChanges();
    expect(c.assinatura()?.status).toBe('PENDENTE'); expect(fixture.nativeElement.querySelector('a.ativacao').getAttribute('href')).toBe(link);
    tick(5000); http.expectOne(assinaturaUrl).flush({ ...pendente(), status: 'ATIVA', confirmadoEm: '2026-10-14T18:00:00Z' }); fixture.detectChanges();
    expect(c.linkAtivacao()).toBeNull(); expect(fixture.nativeElement.textContent).toContain('Recebimento ativo');
    tick(10000); http.expectNone(assinaturaUrl); fixture.destroy();
  }));
  it('recarga pendente não reconstrói o link ou repete POST', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush(pendente()); fixture.detectChanges();
    expect(fixture.componentInstance.linkAtivacao()).toBeNull(); expect(fixture.nativeElement.textContent).toContain('link não é recuperado');
    http.expectNone(`${assinaturaUrl}/ativacao`); fixture.destroy(); tick(5000); http.expectNone(assinaturaUrl);
  }));
  it('expiração do código e erro encerram acompanhamento', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush({ ...pendente(), codigoExpiraEm: new Date(Date.now() + 7000).toISOString() });
    tick(5000); http.expectOne(assinaturaUrl).flush(pendente()); tick(7000); http.expectNone(assinaturaUrl);
    fixture.componentInstance.atualizar(); http.expectOne(assinaturaUrl).flush(pendente()); tick(5000);
    http.expectOne(assinaturaUrl).flush({ detail: 'Sessão expirada' }, { status: 401, statusText: 'Unauthorized' }); flushMicrotasks();
    tick(10000); http.expectNone(assinaturaUrl); expect(fixture.componentInstance.erro()).not.toBeNull(); fixture.destroy();
  }));
  it('troca de número exige novo aceite e cancelamento exige confirmação', () => {
    http.expectOne(assinaturaUrl).flush({ ...pendente(), status: 'ATIVA' });
    const c = fixture.componentInstance; c.trocarNumero(); expect(c.form.controls.aceite.value).toBeFalse();
    c.cancelar(); http.expectNone(req => req.method === 'DELETE');
    c.cancelamentoVisivel.set(true); c.cancelar(); c.cancelar(); const req = http.expectOne(assinaturaUrl); expect(req.request.method).toBe('DELETE'); req.flush(null);
    http.expectOne(assinaturaUrl).flush({ ...assinaturaFixture, status: 'CANCELADA' }); fixture.detectChanges();
    expect(c.linkAtivacao()).toBeNull(); expect(c.cancelamentoVisivel()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('Recebimento cancelado');
  });
  it('falha da ativação preserva formulário e não repete POST', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush(assinaturaFixture); const c = fixture.componentInstance;
    c.form.setValue({ numero: '+5511999999999', aceite: true }); c.solicitar();
    http.expectOne(`${assinaturaUrl}/ativacao`).flush({ detail: 'Número já ativo' }, { status: 409, statusText: 'Conflict' }); flushMicrotasks();
    expect(c.erro()).toBe('Número já ativo'); expect(c.form.controls.numero.value).toBe('+5511999999999'); expect(c.salvando()).toBeFalse();
    tick(10000); http.expectNone(req => req.method === 'POST');
  }));
  it('400 mantém dados e associa validação ao número', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush(assinaturaFixture); fixture.detectChanges(); const c = fixture.componentInstance;
    c.form.setValue({ numero: '+5511999999999', aceite: true }); c.solicitar();
    http.expectOne(`${assinaturaUrl}/ativacao`).flush({ errors: { numero: 'Revise o número informado' } }, { status: 400, statusText: 'Bad Request' }); flushMicrotasks(); fixture.detectChanges();
    expect(c.form.controls.numero.errors?.['api']).toBe('Revise o número informado'); expect(c.form.controls.numero.value).toBe('+5511999999999'); expect(fixture.nativeElement.textContent).toContain('Revise o número informado');
  }));
  it('sem assinatura permite PDF e apresenta erro Blob sem inventar documento', async () => {
    http.expectOne(assinaturaUrl).flush(assinaturaFixture); fixture.componentInstance.baixarPdf(); fixture.componentInstance.baixarPdf();
    const blob = new Blob(); const leitura = Promise.resolve(JSON.stringify({ detail: 'Sem programação hoje' })); spyOn(blob, 'text').and.returnValue(leitura);
    const req = http.expectOne(`${api}/minha-programacao/pdf`); req.flush(blob, { status: 404, statusText: 'Not Found' });
    await leitura; await Promise.resolve(); await fixture.whenStable(); fixture.detectChanges(); expect(fixture.componentInstance.erroPdf()).toBe('Sem programação hoje'); expect(fixture.componentInstance.baixando()).toBeFalse();
  });
  it('falha de consulta não apresenta assinatura como não cadastrada', fakeAsync(() => {
    http.expectOne(assinaturaUrl).flush({}, { status: 503, statusText: 'Unavailable' }); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.componentInstance.assinatura()).toBeNull(); expect(fixture.nativeElement.textContent).not.toContain('Nenhum número cadastrado'); expect(fixture.componentInstance.erro()).toContain('Integração indisponível');
  }));
});
