import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../../../environments/environment';
import { configuracaoFixture, historicoFixture, loteFixture, previaFixture } from '../../testing/whatsapp.fixtures';
import { ConfiguracaoWhatsapp } from '../../models/whatsapp.models';
import { WhatsappAdmin } from './whatsapp-admin';

describe('WhatsappAdmin', () => {
  let fixture: ComponentFixture<WhatsappAdmin>; let http: HttpTestingController;
  const api = `${environment.apiUrl}/integracoes/whatsapp`; const envios = `${api}/envios`; const historicoUrl = `${envios}?pagina=0&tamanho=20`;
  function iniciar(config: ConfiguracaoWhatsapp = configuracaoFixture) {
    http.expectOne(`${api}/configuracao`).flush(config);
    http.expectOne(`${environment.apiUrl}/usuarios`).flush([
      { id: 1, nome: 'Admin', tipoPessoa: 'ADMIN', ativo: true }, { id: 2, nome: 'Ana', tipoPessoa: 'ALUNO', ativo: true }, { id: 3, nome: 'João', tipoPessoa: 'MOTORISTA', ativo: false },
    ]); http.expectOne(historicoUrl).flush(historicoFixture); fixture.detectChanges();
  }
  beforeEach(() => { TestBed.configureTestingModule({ imports: [WhatsappAdmin], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }); http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(WhatsappAdmin); fixture.detectChanges(); });
  afterEach(() => { fixture.destroy(); http.verify(); });
  it('integração pendente mantém prévias/histórico e não permite envio', () => {
    iniciar({ ...configuracaoFixture, integracaoHabilitada: false }); const c = fixture.componentInstance;
    expect(c.usuarios().map(u => u.id)).toEqual([2, 3]); expect(c.pronta()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Aguardando configuração da Meta'); c.abrirEnvio(false); expect(c.envioVisivel()).toBeFalse(); http.expectNone(req => req.method === 'POST');
  });
  it('automático só altera após sucesso e mantém valor em 503', fakeAsync(() => {
    iniciar(); const c = fixture.componentInstance; c.alternarAutomatico();
    const req = http.expectOne(`${api}/configuracao`); expect(req.request.body).toEqual({ automatico: true }); expect(c.configuracao()?.automatico).toBeFalse();
    req.flush({ detail: 'Template indisponível' }, { status: 503, statusText: 'Unavailable' }); flushMicrotasks(); expect(c.configuracao()?.automatico).toBeFalse(); expect(c.configErro()).toBe('Template indisponível');
    c.alternarAutomatico(); http.expectOne(`${api}/configuracao`).flush({ ...configuracaoFixture, automatico: true }); expect(c.configuracao()?.automatico).toBeTrue();
  }));
  it('permite desativar mesmo sem configuração pronta', () => {
    iniciar({ ...configuracaoFixture, automatico: true, integracaoHabilitada: false }); fixture.componentInstance.alternarAutomatico(); const req = http.expectOne(`${api}/configuracao`); expect(req.request.body).toEqual({ automatico: false }); req.flush({ ...configuracaoFixture, automatico: false });
  });
  it('troca de destinatário cancela consulta anterior e preserva somente nova prévia', () => {
    iniciar(); const c = fixture.componentInstance; c.usuarioSelecionado.setValue(2); const anterior = http.expectOne(`${api}/previa?usuarioId=2`);
    c.usuarioSelecionado.setValue(3); expect(anterior.cancelled).toBeTrue(); const req = http.expectOne(`${api}/previa?usuarioId=3`); req.flush({ ...previaFixture, usuarioId: 3, nome: 'João', elegivel: false, impedimentos: ['CONTA_INATIVA', 'WHATSAPP_NAO_CONFIRMADO'] }); fixture.detectChanges();
    expect(c.previa()?.usuarioId).toBe(3); expect(fixture.nativeElement.textContent).toContain('Conta de acesso inativa'); expect(fixture.nativeElement.textContent).toContain('WhatsApp não confirmado');
    c.usuarioSelecionado.setValue(null); expect(c.previa()).toBeNull(); http.expectNone(req => req.url.endsWith('/previa'));
  });
  it('prévia conserva pontos, destinos, nulos e indisponibilidade sem cancelar', () => {
    iniciar(); const dados = structuredClone(previaFixture); dados.programacao.viagens[0].onibusDisponivel = false; dados.programacao.viagens[0].onibus!.modelo = null;
    fixture.componentInstance.usuarioSelecionado.setValue(2); http.expectOne(`${api}/previa?usuarioId=2`).flush(dados); fixture.detectChanges();
    const texto = fixture.nativeElement.textContent; for (const valor of ['Praça', 'Terminal', 'Faculdade A', 'Faculdade B', 'ABC1234', 'Ônibus indisponível', 'Não informado']) expect(texto).toContain(valor);
    expect(texto.indexOf('Praça')).toBeLessThan(texto.indexOf('Terminal')); expect(texto).not.toContain('cancelada');
  });
  it('histórico usa página zero e retorna à primeira ao mudar tamanho', () => {
    iniciar(); const c = fixture.componentInstance; c.paginar({ first: 40, rows: 20 }); http.expectOne(`${envios}?pagina=2&tamanho=20`).flush({ ...historicoFixture, pagina: 2, total: 100 });
    c.paginar({ first: 40, rows: 50 }); http.expectOne(`${envios}?pagina=0&tamanho=50`).flush({ ...historicoFixture, tamanho: 50 }); expect(c.pagina()).toBe(0); expect(c.tamanho()).toBe(50);
  });
  it('falha de histórico é distinta de lista vazia', fakeAsync(() => {
    iniciar(); fixture.componentInstance.carregarHistorico(); http.expectOne(historicoUrl).flush({ detail: 'Falha de consulta' }, { status: 500, statusText: 'Error' }); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.componentInstance.historico()).toBeNull(); expect(fixture.nativeElement.textContent).toContain('Não foi possível consultar o histórico'); expect(fixture.nativeElement.textContent).not.toContain('Nenhum lote registrado');
  }));
  it('envio exige confirmação, bloqueia repetição e não declara entrega no 202', () => {
    iniciar(); const c = fixture.componentInstance; c.enviar(); http.expectNone(req => req.method === 'POST');
    c.abrirEnvio(false); c.enviar(); c.enviar(); const req = http.expectOne(envios); expect(req.request.body).toEqual({ requestId: jasmine.any(String), publico: 'TODOS', reenviar: false, motivo: null });
    req.flush(loteFixture, { status: 202, statusText: 'Accepted' }); http.expectOne(historicoUrl).flush(historicoFixture); http.expectOne(`${envios}/${loteFixture.id}`).flush(loteFixture); fixture.detectChanges();
    expect(c.aviso()).toContain('Lote registrado para processamento'); expect(c.envioVisivel()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('Aguardando processamento'); c.fecharLote();
  });
  it('reenvio exige motivo não vazio e envia apenas contrato do guia', () => {
    iniciar(); const c = fixture.componentInstance; c.abrirEnvio(true); c.envioForm.controls.motivo.setValue('   '); c.enviar(); http.expectNone(req => req.method === 'POST');
    c.envioForm.controls.motivo.setValue('x'.repeat(501)); expect(c.envioForm.invalid).toBeTrue(); c.envioForm.setValue({ publico: 'ALUNOS', motivo: ' Ônibus alterado ' }); c.enviar(); const req = http.expectOne(envios);
    expect(req.request.body).toEqual({ requestId: jasmine.any(String), publico: 'ALUNOS', reenviar: true, motivo: 'Ônibus alterado' }); req.flush({ detail: 'Revisar motivo' }, { status: 400, statusText: 'Bad Request' }); expect(c.envioVisivel()).toBeTrue(); expect(c.envioForm.controls.motivo.value).toBe(' Ônibus alterado ');
  });
  it('erro incerto consulta histórico/lote e repete somente o mesmo UUID e corpo', fakeAsync(() => {
    iniciar(); const c = fixture.componentInstance; c.abrirEnvio(true); c.envioForm.controls.motivo.setValue('Correção'); c.enviar(); const req = http.expectOne(envios); const corpo = structuredClone(req.request.body);
    req.error(new ProgressEvent('error')); http.expectOne(historicoUrl).flush(historicoFixture); http.expectOne(`${envios}/${corpo.requestId}`).flush({}, { status: 404, statusText: 'Not Found' }); flushMicrotasks();
    expect(c.resultadoIncerto()).toBeTrue(); expect(c.envioForm.disabled).toBeTrue(); tick(15000); http.expectNone(req => req.method === 'POST');
    c.fecharLote(); c.abrirEnvio(false); c.enviar(); const repeticao = http.expectOne(envios); expect(repeticao.request.body).toEqual(corpo); repeticao.flush({ ...loteFixture, id: corpo.requestId, reenvio: true }); http.expectOne(historicoUrl).flush(historicoFixture); http.expectOne(`${envios}/${corpo.requestId}`).flush({ ...loteFixture, id: corpo.requestId }); c.fecharLote();
  }));
  it('encontrar lote após resposta incerta encerra intenção sem novo POST', fakeAsync(() => {
    iniciar(); const c = fixture.componentInstance; c.abrirEnvio(false); c.enviar(); const req = http.expectOne(envios); const id = req.request.body.requestId;
    req.flush({}, { status: 500, statusText: 'Error' }); http.expectOne(historicoUrl).flush(historicoFixture); http.expectOne(`${envios}/${id}`).flush({ ...loteFixture, id }); flushMicrotasks();
    expect(c.resultadoIncerto()).toBeFalse(); expect(c.intencao()).toBeNull(); expect(c.aviso()).toContain('Lote localizado'); c.fecharLote(); tick(10000); http.expectNone(req => req.method === 'POST');
  }));
  it('lote mostra números mascarados, zeros e distintos estados; fechar interrompe polling', fakeAsync(() => {
    iniciar(); const c = fixture.componentInstance; c.abrirLote(loteFixture.id); http.expectOne(`${envios}/${loteFixture.id}`).flush(loteFixture); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('***0001'); expect(c.lote()?.totais.ENTREGUE).toBe(0);
    tick(5000); http.expectOne(`${envios}/${loteFixture.id}`).flush({ ...loteFixture, totais: { ...loteFixture.totais, PENDENTE: 0, ACEITA: 1 } }); expect(c.lote()?.totais.ENTREGUE).toBe(0);
    c.fecharLote(); tick(10000); http.expectNone(`${envios}/${loteFixture.id}`); fixture.destroy();
  }));
  it('PDF de prévia usa Blob e trata erro sem gerar documento vazio', async () => {
    iniciar(); const c = fixture.componentInstance; c.usuarioSelecionado.setValue(2); http.expectOne(`${api}/previa?usuarioId=2`).flush(previaFixture); c.baixarPrevia(); c.baixarPrevia();
    const blob = new Blob(); const leitura = Promise.resolve(JSON.stringify({ detail: 'Sem documento' })); spyOn(blob, 'text').and.returnValue(leitura);
    http.expectOne(`${api}/previa/pdf?usuarioId=2`).flush(blob, { status: 404, statusText: 'Not Found' }); await leitura; await Promise.resolve(); await fixture.whenStable(); expect(c.pdfErro()).toBe('Sem documento');
  });
  it('erro assíncrono do PDF anterior não contamina o novo destinatário', async () => {
    iniciar(); const c = fixture.componentInstance; c.usuarioSelecionado.setValue(2); http.expectOne(`${api}/previa?usuarioId=2`).flush(previaFixture); c.baixarPrevia();
    let concluir!: (valor: string) => void; const leitura = new Promise<string>(resolve => concluir = resolve); const blob = new Blob(); spyOn(blob, 'text').and.returnValue(leitura);
    http.expectOne(`${api}/previa/pdf?usuarioId=2`).flush(blob, { status: 404, statusText: 'Not Found' });
    c.usuarioSelecionado.setValue(3); http.expectOne(`${api}/previa?usuarioId=3`).flush({ ...previaFixture, usuarioId: 3 }); concluir(JSON.stringify({ detail: 'Erro da prévia anterior' }));
    await leitura; await Promise.resolve(); await fixture.whenStable(); expect(c.pdfErro()).toBeNull();
  });
});
