import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { ContaReceberService } from '../../service/conta-receber-service';
import { RecebimentoService } from '../../service/recebimento-service';
import { authReceberFixture, cobrancaFixture, reciboFixture } from '../../testing/receber.fixtures';
import { ReciboMatricula } from '../../models/conta-receber';
import { MinhasMatriculas } from './minhas-matriculas';
describe('MinhasMatriculas', () => {
  let component: MinhasMatriculas, fixture: ComponentFixture<MinhasMatriculas>;
  let contas: jasmine.SpyObj<ContaReceberService>, recebimentos: jasmine.SpyObj<RecebimentoService>;
  const conta = cobrancaFixture({ id: 15 }), recibo = reciboFixture({ contaId: 15 });
  beforeEach(() => {
    sessionStorage.removeItem('integrador.recebimento.pendente.7');
    contas = jasmine.createSpyObj('ContaReceberService', ['listarMinhas']); contas.listarMinhas.and.returnValue(of([conta]));
    recebimentos = jasmine.createSpyObj('RecebimentoService', ['pagar', 'buscarRecibo', 'listarRecibos']); recebimentos.listarRecibos.and.returnValue(of([recibo]));
    TestBed.configureTestingModule({ imports: [MinhasMatriculas], providers: [provideNoopAnimations(), MessageService,
      { provide: AuthService, useValue: authReceberFixture() }, { provide: ContaReceberService, useValue: contas }, { provide: RecebimentoService, useValue: recebimentos }] });
    fixture = TestBed.createComponent(MinhasMatriculas); component = fixture.componentInstance; fixture.detectChanges();
  });
  afterEach(() => sessionStorage.removeItem('integrador.recebimento.pendente.7'));
  it('carrega somente cobranças próprias, exibindo competência, original, recebido e saldo do backend', () => {
    expect(component.contas()).toEqual([conta]); const texto = fixture.nativeElement.textContent;
    for (const v of ['2026-10', '300,00', '100,00', '200,00', 'Parcial']) expect(texto).toContain(v);
  });
  it('mantém tabela sem zebra e ações por ícones acessíveis, inclusive histórico parcial', () => {
    const tabela = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(tabela.stripedRows).not.toBeTrue(); expect(tabela.rowHover).toBeTrue();
    expect(fixture.nativeElement.querySelector('button[aria-label="Ver recibo da conta 15"]')).not.toBeNull();
    const pagar = fixture.nativeElement.querySelector('button[aria-label="Pagar conta 15"]') as HTMLButtonElement;
    pagar.click(); expect(component.pagamento().contaSelecionada()?.id).toBe(15); expect(recebimentos.pagar).not.toHaveBeenCalled();
  });
  it('pesquisa, alternância e paginação mantêm estados consistentes', () => {
    component.primeiraLinha.set(10); component.pesquisar('nao existe'); expect(component.contasVisiveis()).toEqual([]); expect(component.primeiraLinha()).toBe(0);
    component.pesquisar(''); component.contas.set([{ ...conta, status: 'PAGO', saldoRestante: 0, valorRecebido: 300 }]); component.selecionarHistorico(true);
    expect(component.contasVisiveis().length).toBe(1);
  });
  it('pagamento parcial recarrega e abre recibo somente da parcela', () => {
    recebimentos.pagar.and.returnValue(of(recibo)); component.abrirPagamento(conta); component.pagamento().valorPago.setValue(100); component.pagamento().confirmarPagamento();
    expect(recebimentos.pagar).toHaveBeenCalledOnceWith(15, 'PIX', 100, jasmine.any(String)); expect(component.pagamento().recibo()).toEqual(recibo);
    expect(contas.listarMinhas.calls.count()).toBeGreaterThan(1); expect(component.contas()[0].status).toBe('PENDENTE');
  });
  it('não duplica confirmação enquanto primeira requisição está pendente', () => {
    const resposta = new Subject<ReciboMatricula>(); recebimentos.pagar.and.returnValue(resposta);
    component.abrirPagamento(conta); component.pagamento().confirmarPagamento(); component.pagamento().confirmarPagamento();
    expect(recebimentos.pagar).toHaveBeenCalledTimes(1);
  });
  it('400 mantém confirmação editável e mensagem de validação', () => {
    recebimentos.pagar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Valor inválido.' } })));
    component.abrirPagamento(conta); component.pagamento().confirmarPagamento(); expect(component.pagamento().erroPagamento()).toBe('Valor inválido.');
    expect(component.pagamento().contaSelecionada()).not.toBeNull();
  });
  it('histórico consulta todos os recebimentos, sem depender da quitação', () => {
    component.visualizarRecibo(conta); expect(recebimentos.listarRecibos).toHaveBeenCalledOnceWith(15); expect(component.pagamento().recibos()).toEqual([recibo]);
  });
  it('falha depois do sucesso informa pagamento registrado e não reenvia', () => {
    recebimentos.pagar.and.returnValue(of(recibo)); component.abrirPagamento(conta);
    contas.listarMinhas.and.returnValues(of([conta]), throwError(() => new HttpErrorResponse({ status: 500 })), throwError(() => new HttpErrorResponse({ status: 500 })));
    component.pagamento().confirmarPagamento(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pagamento registrado'); expect(recebimentos.pagar).toHaveBeenCalledTimes(1);
  });
  it('traduz status e não inventa estado ausente', () => {
    expect(component.getSeverity('PAGO')).toBe('success'); expect(component.getSeverity('ATRASADO')).toBe('danger');
    expect(component.rotuloStatus('PENDENTE')).toBe('Pendente'); expect(component.rotuloStatus(null)).toBe('Não informado');
  });
});
