import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EmailProgramacao } from './email-programacao';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { environment } from '../../../../../environments/environment';
import { configEmailFixture, EMAIL_ID, historicoEmailFixture, loteEmailFixture, previaEmailFixture } from '../../testing/email-programacao.fixtures';
import { ConfiguracaoEmail, LoteEmail, PreviaEmail } from '../../models/email-programacao.models';
import { diaSaoPaulo, ESTADOS_EMAIL } from '../../utils/email-programacao.utils';
import { IntencaoEmail, SolicitacaoPendente } from '../../utils/solicitacao-pendente';

describe('EmailProgramacao', () => {
  let fixture: ComponentFixture<EmailProgramacao>; let c: EmailProgramacao; let http: HttpTestingController;
  const base = `${environment.apiUrl}/integracoes/email`;
  const user = signal({ id: 1, tipoPessoa: 'ADMIN' });
  const auth = { usuario: user, temPapel: (...papeis: string[]) => papeis.includes(user().tipoPessoa) };
  function inicializar(config: ConfiguracaoEmail = configEmailFixture, previa: PreviaEmail = previaEmailFixture()): void {
    fixture.detectChanges(); http.expectOne(`${base}/configuracao`).flush(config); http.expectOne(`${base}/previa`).flush(previa);
    http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture); fixture.detectChanges();
  }
  function criar(): void { fixture = TestBed.createComponent(EmailProgramacao); c = fixture.componentInstance; }
  function envio(reenvio = false): TestRequest {
    c.abrirEnvio(reenvio); if (reenvio) c.motivo.setValue('Troca do ônibus'); c.confirmarEnvio();
    return http.expectOne(`${base}/envios`);
  }
  function atualizarAposEnvio(falha = false): void {
    const r = http.expectOne(`${base}/previa`); if (falha) r.flush({}, { status: 500, statusText: 'Erro' }); else r.flush(previaEmailFixture());
    http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture);
  }
  beforeEach(async () => {
    sessionStorage.removeItem('integrador.email.request.1'); sessionStorage.removeItem('integrador.email.request.2'); user.set({ id: 1, tipoPessoa: 'ADMIN' });
    await TestBed.configureTestingModule({ imports: [EmailProgramacao], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), { provide: AuthService, useValue: auth }] }).compileComponents();
    http = TestBed.inject(HttpTestingController); criar();
  });
  afterEach(() => { fixture.destroy(); http.verify({ ignoreCancelled: true }); sessionStorage.removeItem('integrador.email.request.1'); sessionStorage.removeItem('integrador.email.request.2'); });

  it('mostra ônibus/motorista em cards por faculdade sem inflar total', () => {
    inicializar(); expect(c.grupos().length).toBe(2); expect(c.previa.dados()?.viagens.length).toBe(1);
    const el = fixture.nativeElement as HTMLElement; expect(el.querySelectorAll('.faculdade').length).toBe(2);
    expect(el.textContent).toContain('Faculdade A'); expect(el.textContent).toContain('João'); expect(el.textContent).toContain('01'); expect(el.textContent).not.toContain('Baixar PDF');
    http.expectNone(r => r.method === 'POST');
  });
  it('pesquisa altera somente os cards, não a programação nem o envio', () => {
    inicializar(); c.pesquisa.set('Faculdade A'); expect(c.grupos().length).toBe(1); expect(c.previa.dados()?.viagens.length).toBe(1);
    const r = envio(); expect(Object.keys(r.request.body).sort()).toEqual(['reenviar', 'requestId']); r.flush({}, { status: 400, statusText: 'Bad Request' });
  });
  it('lista todas as viagens/grades e preserva vínculos nulos', () => {
    const p = previaEmailFixture(); p.viagens.push({ ...p.viagens[0], id: 20, grade: null, rota: null, onibus: null, motorista: null, faculdades: [] });
    inicializar(configEmailFixture, p); expect(c.previa.dados()?.viagens.length).toBe(2); expect(fixture.nativeElement.textContent).toContain('Destino não informado'); expect(fixture.nativeElement.textContent).toContain('Não informado');
  });
  it('ônibus indisponível permanece na escala com aviso', () => {
    const p = previaEmailFixture(); p.viagens[0].onibusDisponivel = false; p.viagens[0].onibus!.statusOnibus = 'QUEBRADO';
    inicializar(configEmailFixture, p); expect(fixture.nativeElement.textContent).toContain('Ônibus indisponível'); expect(c.previa.dados()?.viagens.length).toBe(1);
  });
  it('detalhes preservam ordem dos pontos, destinos e zero de capacidade', () => {
    const p = previaEmailFixture(); p.viagens[0].onibus!.capacidade = 0; inicializar(configEmailFixture, p);
    c.viagemDetalhe.set(p.viagens[0]); fixture.detectChanges(); const texto = fixture.nativeElement.textContent;
    expect(texto.indexOf('Praça')).toBeLessThan(texto.indexOf('Terminal')); expect(texto).toContain('Rua A'); expect(texto).toContain('Rua B'); expect(texto).toContain('0 /');
    const fechar = fixture.nativeElement.querySelector('button[aria-label="Fechar itinerário"]') as HTMLButtonElement;
    expect(fechar).not.toBeNull(); fechar.click(); fixture.detectChanges(); expect(c.viagemDetalhe()).toBeNull();
  });
  it('sem viagens é vazio real e não permite POST', () => {
    inicializar(configEmailFixture, { ...previaEmailFixture(), viagens: [] }); expect(c.podeEnviar()).toBeFalse(); c.abrirEnvio(false); c.confirmarEnvio(); http.expectNone(r => r.method === 'POST'); expect(fixture.nativeElement.textContent).toContain('Não há programação para hoje');
  });
  it('sem destinatários bloqueia envio mesmo com viagens', () => { inicializar(configEmailFixture, { ...previaEmailFixture(), destinatariosElegiveis: 0 }); expect(c.podeEnviar()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('Nenhum destinatário elegível'); });
  it('indisponibilidade SMTP não impede prévia/histórico', () => { inicializar({ ...configEmailFixture, disponivel: false, impedimentos: ['Servidor SMTP não configurado.'] }); expect(c.grupos().length).toBe(2); expect(c.podeEnviar()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('Servidor SMTP não configurado'); });
  it('falha de prévia é erro, não nenhuma viagem', () => {
    fixture.detectChanges(); http.expectOne(`${base}/configuracao`).flush(configEmailFixture); http.expectOne(`${base}/previa`).flush({}, { status: 500, statusText: 'Erro' }); http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture); fixture.detectChanges();
    expect(c.previa.erro()).not.toBeNull(); expect(c.previa.dados()).toBeNull(); expect(fixture.nativeElement.textContent).not.toContain('Não há programação para hoje');
  });
  it('atualização falha mantém dados marcados desatualizados e bloqueia envio', () => {
    inicializar(); c.atualizar(); http.expectOne(`${base}/configuracao`).flush(configEmailFixture); http.expectOne(`${base}/previa`).flush({}, { status: 500, statusText: 'Erro' }); http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture); fixture.detectChanges();
    expect(c.previa.dados()?.viagens.length).toBe(1); expect(c.podeEnviar()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('desatualizada');
  });
  it('falha de histórico é independente da programação', () => {
    inicializar(); c.carregarHistorico(); http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush({}, { status: 500, statusText: 'Erro' }); expect(c.podeEnviar()).toBeTrue(); expect(c.historico.erro()).not.toBeNull();
  });
  it('prévia não é editor HTML nem executa HTML cadastrado', () => {
    const p = previaEmailFixture(); p.mensagem.texto = '<img src=x onerror="alert(1)">'; p.mensagem.html = '<script>alert(1)</script>';
    inicializar(configEmailFixture, p); c.mensagemVisivel.set(true); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('.mensagem').textContent).toBe(p.mensagem.texto); expect(fixture.nativeElement.querySelector('.mensagem img')).toBeNull();
  });
  it('abrir confirmação não envia; duplo clique confirma somente um POST', () => {
    inicializar(); c.abrirEnvio(false); http.expectNone(r => r.method === 'POST'); c.confirmarEnvio(); c.confirmarEnvio();
    const r = http.expectOne(`${base}/envios`); expect(c.enviando()).toBeTrue(); expect(c.podeEnviar()).toBeFalse();
    const salvo = JSON.parse(sessionStorage.getItem('integrador.email.request.1')!); expect(salvo.request).toEqual(r.request.body); expect(r.request.body.requestId).toMatch(/^[\da-f-]{36}$/i);
    r.flush({}, { status: 400, statusText: 'Bad Request' });
  });
  it('202 mostra lote/processamento e conserva conteúdo congelado mesmo se atualização falhar', () => {
    inicializar(); const r = envio(); const l = loteEmailFixture(); l.id = r.request.body.requestId; r.flush(l, { status: 202, statusText: 'Accepted' }); atualizarAposEnvio(true); fixture.detectChanges();
    expect(c.intencao()).toBeNull(); expect(sessionStorage.getItem('integrador.email.request.1')).toBeNull(); expect(c.detalheVisivel()).toBeTrue(); expect(c.detalhe.dados()?.mensagem?.texto).toBe('Ônibus original: 01'); expect(c.aviso()).toContain('registrado para processamento'); expect(fixture.nativeElement.textContent).toContain('não comprova chegada');
  });
  it('correção exige motivo e normaliza espaços, limite 500', () => {
    inicializar(); c.abrirEnvio(true);
    for (const m of ['', '  ', 'x'.repeat(501)]) { c.motivo.setValue(m); c.confirmarEnvio(); http.expectNone(r => r.method === 'POST'); }
    c.motivo.setValue('  Ônibus alterado  '); c.confirmarEnvio(); const r = http.expectOne(`${base}/envios`); expect(r.request.body.motivo).toBe('Ônibus alterado'); expect(r.request.body.reenviar).toBeTrue(); r.flush({}, { status: 400, statusText: 'Bad Request' });
  });
  it('400 mantém diálogo/motivo e associa errors ao controle', () => {
    inicializar(); const r = envio(true); r.flush({ detail: 'Revise', errors: { motivo: 'Justificativa inválida' } }, { status: 400, statusText: 'Bad Request' });
    expect(c.envioVisivel()).toBeTrue(); expect(c.motivo.value).toBe('Troca do ônibus'); expect(c.motivo.errors?.['servidor']).toBe('Justificativa inválida'); expect(c.intencao()).toBeNull(); c.motivo.setValue('Corrigida'); expect(c.motivo.valid).toBeTrue();
  });
  it('409 mantém a intenção e os dados, sem trocar UUID', () => {
    inicializar(); const r = envio(true); const request = r.request.body; r.flush({ detail: 'Identificador já utilizado' }, { status: 409, statusText: 'Conflict' });
    expect(c.envioVisivel()).toBeTrue(); expect(c.intencao()?.request).toEqual(request); expect(c.erroEnvio()).toContain('Identificador'); expect(c.podeEnviar()).toBeFalse();
  });
  for (const status of [0, 408, 500, 503]) it(`${status} preserva UUID e não repete POST automaticamente`, () => {
    inicializar(); const r = envio(); const request = r.request.body;
    if (status === 0) r.error(new ProgressEvent('error')); else r.flush({ detail: 'Indisponível' }, { status, statusText: 'Erro' });
    expect(c.intencao()?.request).toEqual(request); expect(c.envioVisivel()).toBeFalse(); expect(c.erroEnvio()).toContain('Não foi possível confirmar'); http.expectNone(req => req.method === 'POST');
  });
  it('retomada explícita repete corpo exato, sem criar nova ação', () => {
    inicializar(); const r = envio(true); const request = r.request.body; r.error(new ProgressEvent('error'));
    c.retomar(); c.motivo.setValue('Texto modificado pelo teste'); c.confirmarEnvio(); const repetido = http.expectOne(`${base}/envios`); expect(repetido.request.body).toEqual(request); repetido.flush({}, { status: 400, statusText: 'Bad Request' });
  });
  it('restaura após recarga sem disparar envio', () => {
    inicializar(); const r = envio(); const request = r.request.body; r.error(new ProgressEvent('error')); fixture.destroy(); criar(); inicializar();
    expect(c.intencao()?.request).toEqual(request); http.expectNone(req => req.method === 'POST');
  });
  it('outro administrador não restaura pendência nem escreve em nome do anterior', () => {
    inicializar(); const r = envio(); r.error(new ProgressEvent('error')); user.set({ id: 2, tipoPessoa: 'ADMIN' }); c.retomar(); c.confirmarEnvio(); http.expectNone(req => req.method === 'POST');
    fixture.destroy(); criar(); inicializar(); expect(c.intencao()).toBeNull();
  });
  it('storage bloqueado mantém intenção em memória e avisa sobre recarga', () => {
    inicializar(); spyOn(Storage.prototype, 'setItem').and.throwError('Bloqueado'); const r = envio(); expect(c.avisoStorage()).toContain('Não recarregue'); expect(c.intencao()).not.toBeNull(); r.error(new ProgressEvent('error'));
  });
  it('consultar pendência localizada resolve localmente sem novo envio', () => {
    inicializar(); const r = envio(); const request = r.request.body; r.error(new ProgressEvent('error')); c.consultarPendente();
    http.expectOne(`${base}/envios/${request.requestId}`).flush({ ...loteEmailFixture(), id: request.requestId }); expect(c.intencao()).toBeNull(); expect(c.detalhe.dados()?.id).toBe(request.requestId); http.expectNone(req => req.method === 'POST');
  });
  it('404 de pendência mantém UUID e atualiza histórico', () => {
    inicializar(); const r = envio(); r.error(new ProgressEvent('error')); const id = c.intencao()!.request.requestId; c.consultarPendente(); http.expectOne(`${base}/envios/${id}`).flush({}, { status: 404, statusText: 'Not Found' }); http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture);
    expect(c.intencao()?.request.requestId).toBe(id); expect(c.pendenciaNaoLocalizada()).toBeTrue(); expect(c.detalhe.dados()).toBeNull();
  });
  it('não retoma intenção de outro dia e exige consulta/confirmar encerramento', () => {
    const ontem = diaSaoPaulo(new Date(Date.now() - 86400000)); const i: IntencaoEmail = { versao: 1, adminId: 1, dataReferencia: ontem, criadoEm: new Date().toISOString(), request: { requestId: EMAIL_ID, reenviar: false } };
    new SolicitacaoPendente(1).salvar(i); inicializar(); expect(c.podeRetomar()).toBeFalse(); c.retomar(); c.confirmarEnvio(); http.expectNone(req => req.method === 'POST');
    expect(c.podeResolverAntiga()).toBeFalse(); c.consultarPendente(); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush({}, { status: 404, statusText: 'Not Found' }); http.expectOne(`${base}/envios?pagina=0&tamanho=20`).flush(historicoEmailFixture);
    expect(c.podeResolverAntiga()).toBeTrue(); c.resolverAntiga(); expect(c.intencao()).not.toBeNull(); c.resolucaoVisivel.set(true); c.resolverAntiga(); expect(c.intencao()).toBeNull();
  });
  it('prévia de outro dia não inicia POST mesmo que backend indique disponibilidade', () => { inicializar(configEmailFixture, { ...previaEmailFixture(), dataReferencia: '2020-01-01' }); c.abrirEnvio(false); expect(c.erroEnvio()).toContain('dia mudou'); c.confirmarEnvio(); http.expectNone(req => req.method === 'POST'); });
  it('troca do dia depois de abrir confirmação bloqueia envio', () => { inicializar(); c.abrirEnvio(false); c.previa.dados.set({ ...previaEmailFixture(), dataReferencia: '2020-01-01' }); c.confirmarEnvio(); expect(c.intencao()).toBeNull(); http.expectNone(req => req.method === 'POST'); });
  it('ativação é confirmada e não otimista; erro mantém estado anterior', () => {
    inicializar(); c.solicitarAutomatico(); expect(c.automaticoVisivel()).toBeTrue(); http.expectNone(r => r.method === 'PUT'); c.confirmarAutomatico(); const r = http.expectOne(`${base}/configuracao`); expect(r.request.body).toEqual({ automatico: true }); expect(c.config.dados()?.automatico).toBeFalse(); r.flush({ detail: 'SMTP indisponível' }, { status: 503, statusText: 'Unavailable' }); expect(c.config.dados()?.automatico).toBeFalse(); expect(c.automaticoVisivel()).toBeTrue();
  });
  it('ativação bem-sucedida usa situação devolvida pelo servidor', () => { inicializar(); c.solicitarAutomatico(); c.confirmarAutomatico(); http.expectOne(`${base}/configuracao`).flush({ ...configEmailFixture, automatico: true }); expect(c.config.dados()?.automatico).toBeTrue(); expect(c.automaticoVisivel()).toBeFalse(); });
  it('desativa automático mesmo com integração indisponível', () => { inicializar({ ...configEmailFixture, disponivel: false, automatico: true }); c.solicitarAutomatico(); const r = http.expectOne(`${base}/configuracao`); expect(r.request.body).toEqual({ automatico: false }); r.flush({ ...configEmailFixture, automatico: false, disponivel: false }); expect(c.config.dados()?.automatico).toBeFalse(); });
  it('não ativa automático sem disponibilidade', () => { inicializar({ ...configEmailFixture, disponivel: false }); c.solicitarAutomatico(); c.confirmarAutomatico(); expect(c.automaticoVisivel()).toBeFalse(); http.expectNone(r => r.method === 'PUT'); });
  it('mudança rápida de página cancela resposta antiga; troca de tamanho volta ao zero', () => {
    inicializar(); c.paginar({ first: 20, rows: 20 }); const anterior = http.expectOne(`${base}/envios?pagina=1&tamanho=20`); c.paginar({ first: 40, rows: 20 }); expect(anterior.cancelled).toBeTrue(); http.expectOne(`${base}/envios?pagina=2&tamanho=20`).flush({ ...historicoEmailFixture, pagina: 2 }); c.paginar({ first: 40, rows: 50 }); http.expectOne(`${base}/envios?pagina=0&tamanho=50`).flush({ ...historicoEmailFixture, tamanho: 50 }); expect(c.pagina()).toBe(0);
  });
  it('rejeita paginação inválida e não reconsulta mesma página', () => { inicializar(); c.paginar({ first: 0, rows: 20 }); c.paginar({ rows: 200 }); expect(c.tamanho()).toBe(20); http.expectNone(r => r.url === `${base}/envios`); });
  it('troca de lote cancela consulta e não mostra conteúdo de outro', () => {
    inicializar(); c.abrirDetalhe(EMAIL_ID); const a = http.expectOne(`${base}/envios/${EMAIL_ID}`); c.abrirDetalhe('outro'); expect(a.cancelled).toBeTrue(); http.expectOne(`${base}/envios/outro`).flush({ ...loteEmailFixture(), id: 'outro' }); expect(c.detalhe.dados()?.id).toBe('outro');
  });
  it('detalhe usa conteúdo congelado, totais e todos os sete estados', () => {
    inicializar(); const l = loteEmailFixture(); l.entregas = ESTADOS_EMAIL.map((e, n) => ({ ...l.entregas[0], id: `${n}`, estado: e.value, revisao: n, erro: n === 3 ? 'SMTP_FALHA' : null })); c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l); fixture.detectChanges();
    expect(c.detalhe.dados()?.mensagem?.texto).not.toBe(c.previa.dados()?.mensagem.texto); for (const e of ESTADOS_EMAIL) expect(fixture.nativeElement.textContent).toContain(e.label); expect(fixture.nativeElement.textContent).toContain('SMTP_FALHA');
  });
  it('fechar detalhe cancela GET em andamento', () => { inicializar(); c.abrirDetalhe(EMAIL_ID); const r = http.expectOne(`${base}/envios/${EMAIL_ID}`); c.fecharDetalhe(); expect(r.cancelled).toBeTrue(); expect(c.detalheVisivel()).toBeFalse(); });
  it('polling só consulta GET sem sobreposição e para ao concluir', fakeAsync(() => {
    inicializar(); const l: LoteEmail = loteEmailFixture(); l.totais.PENDENTE = 1; c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l);
    tick(5000); const r = http.expectOne(`${base}/envios/${EMAIL_ID}`); expect(r.request.method).toBe('GET'); tick(15000); http.expectNone(`${base}/envios/${EMAIL_ID}`); r.flush(loteEmailFixture()); tick(10000); http.expectNone(`${base}/envios/${EMAIL_ID}`); http.expectNone(req => req.method === 'POST');
  }));
  it('polling termina no fechamento', fakeAsync(() => { inicializar(); const l = loteEmailFixture(); l.totais.PROCESSANDO = 1; c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l); c.fecharDetalhe(); expect(c.detalheVisivel()).toBeFalse(); tick(10000); http.expectNone(`${base}/envios/${EMAIL_ID}`); }));
  it('polling termina em erro, preserva resultados com aviso', fakeAsync(() => { inicializar(); const l = loteEmailFixture(); l.totais.PENDENTE = 1; c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l); tick(5000); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush({}, { status: 500, statusText: 'Erro' }); tick(10000); http.expectNone(`${base}/envios/${EMAIL_ID}`); expect(c.detalhe.erro()).not.toBeNull(); expect(c.detalhe.dados()).toEqual(l); }));
  it('polling limita a dez minutos mesmo com requisição lenta', fakeAsync(() => { inicializar(); const l = loteEmailFixture(); l.totais.PENDENTE = 1; c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l); tick(5000); const r = http.expectOne(`${base}/envios/${EMAIL_ID}`); tick(595000); expect(r.cancelled).toBeTrue(); expect(c.pollingExpirou()).toBeTrue(); tick(10000); http.expectNone(`${base}/envios/${EMAIL_ID}`); }));
  it('destruição encerra polling e nenhuma escrita é agendada', fakeAsync(() => { inicializar(); const l = loteEmailFixture(); l.totais.PENDENTE = 1; c.abrirDetalhe(EMAIL_ID); http.expectOne(`${base}/envios/${EMAIL_ID}`).flush(l); fixture.destroy(); expect(c.detalhe.dados()).toEqual(l); tick(10000); http.expectNone(req => req.url.startsWith(base)); }));
  for (const status of [401, 403]) it(`${status} não provoca repetição ou outro identificador`, () => { inicializar(); const r = envio(); const id = r.request.body.requestId; r.flush({}, { status, statusText: 'Unauthorized' }); user.set({ id: 1, tipoPessoa: 'ALUNO' }); c.retomar(); c.confirmarEnvio(); expect(c.intencao()?.request.requestId).toBe(id); http.expectNone(req => req.method === 'POST'); });
});
