import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber, ReciboMatricula } from '../../models/conta-receber';
import { RecebimentoService } from '../../service/recebimento-service';
import { MinhasMatriculas } from './minhas-matriculas';

describe('MinhasMatriculas', () => {
  let component: MinhasMatriculas;
  let fixture: ComponentFixture<MinhasMatriculas>;
  let contaService: jasmine.SpyObj<ContaReceberService>;
  let recebimentoService: jasmine.SpyObj<RecebimentoService>;
  let messages: jasmine.SpyObj<MessageService>;

  const conta: ContaReceber = {
    id: 15,
    descricao: 'Mensalidade setembro/2026',
    valor: 250,
    dataVencimento: '2026-09-30',
    status: 'PENDENTE',
    alunoId: 10,
    nomeAluno: 'Aluno Teste',
  };

  const recibo: ReciboMatricula = {
    id: 50,
    contaId: 15,
    valor: 250,
    dataRecebimento: '2026-09-13T10:00:00',
    formaPagamento: 'PIX',
    nomeAluno: 'Aluno Teste',
    descricaoConta: 'Mensalidade setembro/2026',
  };

  beforeEach(async () => {
    contaService = jasmine.createSpyObj<ContaReceberService>('ContaReceberService', [
      'listarMinhas',
    ]);
    recebimentoService = jasmine.createSpyObj<RecebimentoService>('RecebimentoService', [
      'pagar',
      'buscarRecibo',
    ]);
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    contaService.listarMinhas.and.returnValue(of([conta]));

    await TestBed.configureTestingModule({
      imports: [MinhasMatriculas],
      providers: [
        provideNoopAnimations(),
        { provide: ContaReceberService, useValue: contaService },
        { provide: RecebimentoService, useValue: recebimentoService },
        { provide: MessageService, useValue: messages },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasMatriculas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega as cobranças do aluno', () => {
    expect(component.contas()).toEqual([conta]);
    expect(component.carregando()).toBeFalse();
    expect(contaService.listarMinhas).toHaveBeenCalledTimes(1);
  });

  it('paga somente com id da conta e forma de pagamento, recarrega e abre o recibo', () => {
    recebimentoService.pagar.and.returnValue(of(recibo));

    component.abrirPagamento(conta);
    component.pagamento().confirmarPagamento();

    expect(recebimentoService.pagar).toHaveBeenCalledOnceWith(15, 'PIX');
    expect(component.pagamento().contaSelecionada()).toBeNull();
    expect(component.pagamento().contaRecibo()).toEqual(conta);
    expect(component.pagamento().recibo()).toEqual(recibo);
    expect(contaService.listarMinhas).toHaveBeenCalledTimes(2);
    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success', summary: 'Pagamento realizado' }),
    );
  });

  it('mantém o diálogo aberto quando o backend retorna 400', () => {
    recebimentoService.pagar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { detail: 'Forma de pagamento inválida.' },
          }),
      ),
    );

    component.abrirPagamento(conta);
    component.pagamento().confirmarPagamento();

    expect(component.pagamento().contaSelecionada()).toEqual(conta);
    expect(component.pagamento().erroPagamento()).toBe('Forma de pagamento inválida.');
  });

  it('impede dois pagamentos enquanto a primeira requisição está em andamento', () => {
    const resposta = new Subject<ReciboMatricula>();
    recebimentoService.pagar.and.returnValue(resposta.asObservable());

    component.abrirPagamento(conta);
    component.pagamento().confirmarPagamento();
    component.pagamento().confirmarPagamento();

    expect(recebimentoService.pagar).toHaveBeenCalledTimes(1);
    expect(component.pagamento().pagando()).toBeTrue();
    resposta.complete();
    expect(component.pagamento().pagando()).toBeFalse();
  });

  it('fecha o diálogo e recarrega a lista quando a cobrança já foi paga', () => {
    recebimentoService.pagar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'Esta cobrança já foi paga.' },
          }),
      ),
    );

    component.abrirPagamento(conta);
    component.pagamento().confirmarPagamento();

    expect(component.pagamento().contaSelecionada()).toBeNull();
    expect(contaService.listarMinhas).toHaveBeenCalledTimes(2);
    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'warn', summary: 'Cobrança já paga' }),
    );
  });

  it('fecha o diálogo e recarrega a lista quando a cobrança não existe', () => {
    recebimentoService.pagar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { detail: 'Cobrança não encontrada.' },
          }),
      ),
    );

    component.abrirPagamento(conta);
    component.pagamento().confirmarPagamento();

    expect(component.pagamento().contaSelecionada()).toBeNull();
    expect(contaService.listarMinhas).toHaveBeenCalledTimes(2);
    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error', summary: 'Cobrança não encontrada' }),
    );
  });

  it('mapeia os três status financeiros para a apresentação', () => {
    expect(component.getSeverity('PENDENTE')).toBe('warn');
    expect(component.getSeverity('ATRASADO')).toBe('danger');
    expect(component.getSeverity('PAGO')).toBe('success');
    expect(component.rotuloStatus('PENDENTE')).toBe('Pendente');
    expect(component.rotuloStatus('ATRASADO')).toBe('Atrasado');
    expect(component.rotuloStatus('PAGO')).toBe('Pago');
  });

  it('busca o recibo somente para uma cobrança paga', () => {
    recebimentoService.buscarRecibo.and.returnValue(of(recibo));
    const paga: ContaReceber = { ...conta, status: 'PAGO' };

    component.visualizarRecibo(paga);

    expect(recebimentoService.buscarRecibo).toHaveBeenCalledOnceWith(15);
    expect(component.pagamento().contaRecibo()).toEqual(paga);
    expect(component.pagamento().recibo()).toEqual(recibo);
  });
});
