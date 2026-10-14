import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { CobrancaParaPagamento, ReciboMatricula } from '../../models/conta-receber';
import { RecebimentoService } from '../../service/recebimento-service';
import { PagamentoMatricula } from './pagamento-matricula';

describe('PagamentoMatricula compartilhado', () => {
  let fixture: ComponentFixture<PagamentoMatricula>;
  let componente: PagamentoMatricula;
  let service: jasmine.SpyObj<RecebimentoService>;
  let messages: jasmine.SpyObj<MessageService>;
  const conta: CobrancaParaPagamento = { id: 42, descricao: 'Mensalidade', valor: 230, dataVencimento: '2026-10-12', status: 'PENDENTE' };
  const recibo: ReciboMatricula = { id: 1, contaId: 42, valor: 230, dataRecebimento: '2026-10-12', formaPagamento: 'PIX', nomeAluno: 'Ana', descricaoConta: 'Mensalidade' };
  beforeEach(() => {
    service = jasmine.createSpyObj('RecebimentoService', ['pagar', 'buscarRecibo']);
    messages = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({ imports: [PagamentoMatricula], providers: [provideNoopAnimations(),
      { provide: RecebimentoService, useValue: service }, { provide: MessageService, useValue: messages }] });
    fixture = TestBed.createComponent(PagamentoMatricula); componente = fixture.componentInstance; fixture.detectChanges();
  });
  it('aceita resumo sem identidade e emite recibo e valor real da cobrança', () => {
    service.pagar.and.returnValue(of(recibo)); const concluido = jasmine.createSpy('concluido'); componente.concluido.subscribe(concluido);
    componente.abrirPagamento(conta); componente.confirmarPagamento();
    expect(service.pagar).toHaveBeenCalledOnceWith(42, 'PIX'); expect(concluido).toHaveBeenCalledOnceWith(recibo);
    expect(componente.recibo()).toEqual(recibo); expect(componente.contaRecibo()).toEqual(conta);
    expect(componente.contaSelecionada()).toBeNull();
  });
  it('bloqueia envio duplicado e fechamento durante o POST', () => {
    const resposta = new Subject<ReciboMatricula>(); service.pagar.and.returnValue(resposta);
    componente.abrirPagamento(conta); componente.confirmarPagamento(); componente.confirmarPagamento(); componente.fecharPagamento();
    expect(service.pagar).toHaveBeenCalledTimes(1); expect(componente.contaSelecionada()).not.toBeNull();
    resposta.next(recibo); resposta.complete(); expect(componente.pagando()).toBeFalse();
  });
  it('400 mantém confirmação e erro de campo retornado', () => {
    service.pagar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { formaPagamento: 'Selecione uma forma válida' } } })));
    componente.abrirPagamento(conta); componente.confirmarPagamento();
    expect(componente.contaSelecionada()).not.toBeNull(); expect(componente.erroPagamento()).toBe('Selecione uma forma válida');
  });
  for (const status of [404, 409]) {
    it(`${status} fecha e pede reconsulta sem repetir POST`, () => {
      service.pagar.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      const reconsultar = jasmine.createSpy('reconsultar'); componente.reconsultar.subscribe(reconsultar);
      componente.abrirPagamento(conta); componente.confirmarPagamento();
      expect(componente.contaSelecionada()).toBeNull(); expect(reconsultar).toHaveBeenCalledTimes(1); expect(service.pagar).toHaveBeenCalledTimes(1);
    });
  }
  it('rede incerta não repete POST nem gera toast duplicado e exige reconsulta', () => {
    service.pagar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const reconsultar = jasmine.createSpy('reconsultar'); componente.reconsultar.subscribe(reconsultar);
    componente.abrirPagamento(conta); componente.confirmarPagamento(); componente.confirmarPagamento();
    expect(service.pagar).toHaveBeenCalledTimes(1); expect(messages.add).not.toHaveBeenCalled();
    expect(componente.erroPagamento()).toContain('pode ter sido registrado');
    componente.atualizarAposFalha(); expect(reconsultar).toHaveBeenCalledTimes(1);
    componente.abrirPagamento(conta); expect(componente.falhaRede()).toBeFalse();
  });
  it('não paga cobrança sem valor, vencimento, situação ou já paga', () => {
    for (const invalida of [{ ...conta, valor: null }, { ...conta, dataVencimento: null }, { ...conta, status: null }, { ...conta, status: 'PAGO' as const }]) {
      componente.abrirPagamento(invalida); componente.confirmarPagamento();
      expect(componente.contaSelecionada()).toBeNull();
    }
    expect(service.pagar).not.toHaveBeenCalled();
  });
  it('consulta recibo do servidor somente para conta paga', () => {
    service.buscarRecibo.and.returnValue(of(recibo)); componente.visualizarRecibo(conta);
    expect(service.buscarRecibo).not.toHaveBeenCalled(); componente.visualizarRecibo({ ...conta, status: 'PAGO' });
    expect(service.buscarRecibo).toHaveBeenCalledOnceWith(42); expect(componente.recibo()).toEqual(recibo);
    fixture.detectChanges(); expect(document.body.textContent).toContain('12/10/2026');
  });
  it('404 do recibo pede reconsulta e não inventa comprovante', () => {
    service.buscarRecibo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const reconsultar = jasmine.createSpy('reconsultar'); componente.reconsultar.subscribe(reconsultar);
    componente.visualizarRecibo({ ...conta, status: 'PAGO' });
    expect(componente.recibo()).toBeNull(); expect(reconsultar).toHaveBeenCalledTimes(1);
  });
});
