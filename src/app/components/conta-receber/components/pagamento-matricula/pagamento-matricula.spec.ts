import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { ContaReceberService } from '../../service/conta-receber-service';
import { RecebimentoService } from '../../service/recebimento-service';
import { ReciboMatricula } from '../../models/conta-receber';
import { authReceberFixture, cobrancaFixture, reciboFixture } from '../../testing/receber.fixtures';
import { RecebimentoPendente } from '../../utils/recebimento-pendente';
import { PagamentoMatricula } from './pagamento-matricula';
describe('PagamentoMatricula parcial e recuperação', () => {
  let fixture: ComponentFixture<PagamentoMatricula>, c: PagamentoMatricula;
  let service: jasmine.SpyObj<RecebimentoService>, contas: jasmine.SpyObj<ContaReceberService>, auth: ReturnType<typeof authReceberFixture> & { carregarPerfil: jasmine.Spy };
  let messages: jasmine.SpyObj<MessageService>;
  const conta = cobrancaFixture(), recibo = reciboFixture();
  const erro = (status: number, detail = 'Detalhe seguro') => throwError(() => new HttpErrorResponse({ status, error: { detail } }));
  beforeEach(() => {
    sessionStorage.removeItem('integrador.recebimento.pendente.7');
    service = jasmine.createSpyObj('RecebimentoService', ['pagar', 'buscarRecibo', 'listarRecibos']);
    contas = jasmine.createSpyObj('ContaReceberService', ['listarMinhas']);
    contas.listarMinhas.and.returnValue(of([conta])); service.listarRecibos.and.returnValue(of([recibo]));
    auth = { ...authReceberFixture(), carregarPerfil: jasmine.createSpy('carregarPerfil').and.returnValue(of({})) }; messages = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({ imports: [PagamentoMatricula], providers: [provideNoopAnimations(),
      { provide: AuthService, useValue: auth }, { provide: ContaReceberService, useValue: contas },
      { provide: RecebimentoService, useValue: service }, { provide: MessageService, useValue: messages }] });
  });
  afterEach(() => sessionStorage.removeItem('integrador.recebimento.pendente.7'));
  function criar() { fixture = TestBed.createComponent(PagamentoMatricula); c = fixture.componentInstance; fixture.detectChanges(); }
  it('preenche saldo, não original; confirma parcela com chave e sem identidade no payload', () => {
    criar(); service.pagar.and.returnValue(of(recibo)); const concluido = jasmine.createSpy(); c.concluido.subscribe(concluido);
    c.abrirPagamento(conta); expect(c.valorPago.value).toBe(200); c.valorPago.setValue(100); c.confirmarPagamento();
    expect(service.pagar).toHaveBeenCalledOnceWith(42, 'PIX', 100, jasmine.stringMatching(/^[0-9a-f-]{36}$/));
    expect(concluido).toHaveBeenCalledOnceWith(recibo); expect(c.recibo()).toEqual(recibo);
    expect(auth.carregarPerfil).toHaveBeenCalledTimes(1); expect(c.pendente()).toBeNull();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ summary: 'Pagamento registrado' }));
    expect(JSON.stringify(messages.add.calls.allArgs())).not.toContain('A cobrança foi paga');
  });
  it('duplo clique, valor/forma e fechamento ficam bloqueados durante POST', () => {
    criar(); const resposta = new Subject<ReciboMatricula>(); service.pagar.and.returnValue(resposta);
    c.abrirPagamento(conta); c.confirmarPagamento(); c.confirmarPagamento(); c.fecharPagamento();
    expect(service.pagar).toHaveBeenCalledTimes(1); expect(c.contaSelecionada()).not.toBeNull();
    expect(c.valorPago.disabled).toBeTrue(); expect(c.formaPagamento.disabled).toBeTrue();
    expect(new RecebimentoPendente(7).ler().tipo).toBe('valida');
    resposta.next(recibo); resposta.complete(); expect(c.pagando()).toBeFalse();
  });
  for (const valor of [null, 0, -1, 0.001, 200.01, Infinity, NaN]) {
    it(`não envia parcela inválida ${valor}`, () => { criar(); c.abrirPagamento(conta); c.valorPago.setValue(valor); c.confirmarPagamento(); expect(service.pagar).not.toHaveBeenCalled(); });
  }
  for (const aviso of ['VALOR_INVALIDO', 'QUITACAO_SEM_COMPROVANTE', 'RECEBIMENTO_NEGATIVO_LEGADO', 'RECEBIMENTO_SUPERIOR_A_CONTA']) {
    it(`bloqueia aviso impeditivo ${aviso}`, () => { criar(); expect(c.podePagar({ ...conta, avisos: [aviso] })).toBeFalse(); });
  }
  it('saldo determina elegibilidade; STATUS_DIVERGENTE não impede posição válida', () => {
    criar(); expect(c.podePagar({ ...conta, status: 'PAGO', avisos: ['STATUS_DIVERGENTE'] })).toBeTrue();
    for (const saldoRestante of [0, -1, NaN, Infinity]) expect(c.podePagar({ ...conta, saldoRestante })).toBeFalse();
    expect(c.podePagar({ ...conta, avisos: undefined! })).toBeFalse();
  });
  it('reconsulta antes de confirmar e não ultrapassa saldo que mudou', () => {
    criar(); c.abrirPagamento(conta); c.valorPago.setValue(200); contas.listarMinhas.and.returnValue(of([{ ...conta, saldoRestante: 50 }])); c.confirmarPagamento();
    expect(service.pagar).not.toHaveBeenCalled(); expect(c.erroPagamento()).toContain('saldo restante');
  });
  it('falha de GET antes da confirmação não envia POST', () => {
    criar(); c.abrirPagamento(conta); contas.listarMinhas.and.returnValue(erro(500)); c.confirmarPagamento(); expect(service.pagar).not.toHaveBeenCalled();
  });
  for (const status of [0, 500, 409]) {
    it(`preserva intenção em ${status} e só repete explicitamente com mesmos parâmetros`, () => {
      criar(); service.pagar.and.returnValue(erro(status)); c.abrirPagamento(conta); c.valorPago.setValue(100); c.confirmarPagamento();
      const args = service.pagar.calls.mostRecent().args;
      c.confirmarPagamento(); expect(service.pagar).toHaveBeenCalledTimes(1); expect(c.pendente()?.estado).toBe('INCERTA');
      c.valorPago.setValue(20); c.formaPagamento.setValue('DINHEIRO'); c.repetirConfirmacao();
      expect(service.pagar.calls.mostRecent().args).toEqual(args); expect(service.pagar).toHaveBeenCalledTimes(2);
    });
  }
  it('400 conclusivo permite correção e nova chave', () => {
    criar(); service.pagar.and.returnValue(erro(400)); c.abrirPagamento(conta); c.confirmarPagamento(); const primeira = service.pagar.calls.mostRecent().args[3];
    expect(c.pendente()).toBeNull(); expect(c.contaSelecionada()).not.toBeNull(); c.confirmarPagamento();
    expect(service.pagar.calls.mostRecent().args[3]).not.toBe(primeira);
  });
  for (const status of [401, 403, 404]) {
    it(`${status} inicial não repete e pede atualização`, () => {
      criar(); service.pagar.and.returnValue(erro(status)); c.abrirPagamento(conta); c.confirmarPagamento();
      expect(c.contaSelecionada()).toBeNull(); expect(c.pendente()).toBeNull(); expect(service.pagar).toHaveBeenCalledTimes(1);
    });
  }
  it('recupera intenção após recriação e não a transforma no saldo novo', () => {
    new RecebimentoPendente(7).salvar({ versao: 1, usuarioId: 7, contaId: 42, formaPagamento: 'PIX', valorPago: 100, chave: crypto.randomUUID(), estado: 'INCERTA' });
    criar(); service.pagar.and.returnValue(erro(0)); c.abrirPagamento({ ...conta, saldoRestante: 50 }); expect(c.contaSelecionada()).toBeNull();
    c.repetirConfirmacao(); expect(service.pagar.calls.mostRecent().args[2]).toBe(100);
  });
  it('preserva omissão de valorPago em intenção compatível restaurada', () => {
    new RecebimentoPendente(7).salvar({ versao: 1, usuarioId: 7, contaId: 42, formaPagamento: 'PIX', chave: crypto.randomUUID(), estado: 'INCERTA' });
    criar(); service.pagar.and.returnValue(erro(0)); c.repetirConfirmacao(); expect(service.pagar.calls.mostRecent().args[2]).toBeUndefined();
  });
  it('não reutiliza intenção após logout ou outro usuário', () => {
    criar(); service.pagar.and.returnValue(erro(0)); c.abrirPagamento(conta); c.confirmarPagamento(); auth.usuario.set(null); c.repetirConfirmacao();
    expect(service.pagar).toHaveBeenCalledTimes(1);
  });
  it('falha de armazenamento impede POST', () => {
    criar(); spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado'); c.abrirPagamento(conta); c.confirmarPagamento();
    expect(service.pagar).not.toHaveBeenCalled(); expect(c.armazenamentoBloqueado()).toBeTrue();
  });
  it('pagamento registrado mas atualização falha: somente GET, nunca novo POST', () => {
    criar(); service.pagar.and.returnValue(of(recibo)); auth.carregarPerfil.and.returnValue(erro(500)); c.abrirPagamento(conta); c.confirmarPagamento();
    expect(c.pendente()?.estado).toBe('REGISTRADA'); expect(c.erroPagamento()).toContain('Pagamento registrado');
    c.repetirConfirmacao(); c.confirmarPagamento(); expect(service.pagar).toHaveBeenCalledTimes(1);
    auth.carregarPerfil.and.returnValue(of({})); c.atualizarAposFalha(); expect(c.pendente()).toBeNull();
  });
  it('somente conferência bem sucedida permite abandonar uma intenção incerta', () => {
    criar(); service.pagar.and.returnValue(erro(409)); c.abrirPagamento(conta); c.confirmarPagamento(); c.abandonarAposConferencia(); expect(c.pendente()).not.toBeNull();
    c.atualizarAposFalha(); expect(c.historicoVisivel()).toBeTrue(); c.abandonarAposConferencia(); expect(c.pendente()).toBeNull();
  });
  it('histórico parcial preserva ordem e abre cada recibo sem inventar total', () => {
    criar(); const anterior = { ...recibo, id: 49, valor: 20 }; service.listarRecibos.and.returnValue(of([recibo, anterior]));
    c.visualizarRecibo(conta); expect(service.listarRecibos).toHaveBeenCalledOnceWith(42); expect(c.recibos()).toEqual([recibo, anterior]);
    c.abrirReciboExistente(anterior); expect(c.recibo()?.valor).toBe(20); fixture.detectChanges(); expect(document.body.textContent).toContain('16/10/2026');
    expect(service.buscarRecibo).not.toHaveBeenCalled();
  });
  it('histórico vazio é diferente de 404/erro e não bloqueia por conta pendente parcial', () => {
    criar(); service.listarRecibos.and.returnValue(of([])); c.visualizarRecibo(conta); expect(c.recibos()).toEqual([]); expect(c.erroHistorico()).toBe('');
    service.listarRecibos.and.returnValue(erro(404)); c.visualizarRecibo(conta); expect(c.erroHistorico()).toBe('Detalhe seguro');
  });
  it('atualização assíncrona após sucesso bloqueia nova intenção até terminar', () => {
    criar(); const posicao = new Subject<ReturnType<typeof cobrancaFixture>[]>();
    contas.listarMinhas.and.returnValues(of([conta]), of([conta]), posicao);
    service.pagar.and.returnValue(of(recibo)); c.abrirPagamento(conta); c.confirmarPagamento();
    expect(c.consultando()).toBeTrue(); expect(c.pendente()?.estado).toBe('REGISTRADA'); expect(c.podePagar(conta)).toBeFalse();
    c.repetirConfirmacao(); expect(service.pagar).toHaveBeenCalledTimes(1);
    posicao.next([{ ...conta, saldoRestante: 100, valorRecebido: 200 }]); posicao.complete();
    expect(c.consultando()).toBeFalse(); expect(c.pendente()).toBeNull(); expect(c.podePagar(conta)).toBeTrue();
  });
  it('resposta inesperada preserva intenção incerta em vez de liberar outro POST', () => {
    criar(); service.pagar.and.returnValue(of({ ...recibo, contaId: 99 })); c.abrirPagamento(conta); c.confirmarPagamento();
    expect(c.pendente()?.estado).toBe('INCERTA'); expect(c.erroPagamento()).toContain('Resposta inesperada'); expect(c.recibo()).toBeNull();
  });
  it('leitura corrompida bloqueia pagamento; outra conta não substitui intenção pendente', () => {
    sessionStorage.setItem('integrador.recebimento.pendente.7', '{invalido'); criar(); c.abrirPagamento(conta);
    expect(c.armazenamentoBloqueado()).toBeTrue(); expect(c.contaSelecionada()).toBeNull(); expect(service.pagar).not.toHaveBeenCalled();
  });
  it('depois de uma atualização completa, outra intenção confirmada gera nova chave', () => {
    criar(); service.pagar.and.returnValue(of(recibo)); c.abrirPagamento(conta); c.valorPago.setValue(50); c.confirmarPagamento();
    const chave = service.pagar.calls.mostRecent().args[3]; c.abrirPagamento(conta); c.valorPago.setValue(50); c.confirmarPagamento();
    expect(service.pagar.calls.mostRecent().args[3]).not.toBe(chave);
  });
});
