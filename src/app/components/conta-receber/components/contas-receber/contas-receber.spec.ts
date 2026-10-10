import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber } from '../../models/conta-receber';
import { ContasReceber } from './contas-receber';

describe('ContasReceber', () => {
  let component: ContasReceber;
  let fixture: ComponentFixture<ContasReceber>;
  let service: jasmine.SpyObj<ContaReceberService>;

  const contas: ContaReceber[] = [
    {
      id: 1,
      descricao: 'Mensalidade setembro/2026',
      valor: 250,
      dataVencimento: '2026-09-30',
      status: 'PENDENTE',
      alunoId: 10,
      nomeAluno: 'Aluno Pendente',
    },
    {
      id: 2,
      descricao: 'Mensalidade agosto/2026',
      valor: 250,
      dataVencimento: '2026-08-30',
      status: 'ATRASADO',
      alunoId: 11,
      nomeAluno: 'Aluno Atrasado',
    },
    {
      id: 3,
      descricao: 'Mensalidade julho/2026',
      valor: 250,
      dataVencimento: '2026-07-30',
      status: 'PAGO',
      alunoId: 12,
      nomeAluno: 'Aluno Pago',
    },
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<ContaReceberService>('ContaReceberService', ['listarTodas']);

    await TestBed.configureTestingModule({
      imports: [ContasReceber],
      providers: [
        provideNoopAnimations(),
        { provide: ContaReceberService, useValue: service },
      ],
    }).compileComponents();
  });

  function criarComResposta(resposta: ReturnType<ContaReceberService['listarTodas']>): void {
    service.listarTodas.and.returnValue(resposta);
    fixture = TestBed.createComponent(ContasReceber);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('carrega e separa contas em aberto das pagas', () => {
    criarComResposta(of(contas));

    expect(service.listarTodas).toHaveBeenCalledTimes(1);
    expect(component.contasEmAberto().map((conta) => conta.id)).toEqual([1, 2]);
    expect(component.contasVisiveis().map((conta) => conta.id)).toEqual([1, 2]);

    component.selecionarHistorico(true);
    expect(component.contasPagas().map((conta) => conta.id)).toEqual([3]);
    expect(component.contasVisiveis().map((conta) => conta.id)).toEqual([3]);
  });

  it('encerra o carregamento e mostra o erro da API', () => {
    criarComResposta(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { detail: 'Não foi possível consultar as contas.' },
          }),
      ),
    );

    expect(component.carregando()).toBeFalse();
    expect(component.erro()).toBe('Não foi possível consultar as contas.');
  });

  it('representa corretamente uma resposta vazia', () => {
    criarComResposta(of([]));

    expect(component.contas()).toEqual([]);
    expect(component.contasEmAberto()).toEqual([]);
    expect(component.contasPagas()).toEqual([]);
    expect(component.erro()).toBeNull();
  });

  it('mapeia os status financeiros para rótulo e severidade', () => {
    criarComResposta(of([]));

    expect(component.getSeverity('PENDENTE')).toBe('warn');
    expect(component.getSeverity('ATRASADO')).toBe('danger');
    expect(component.getSeverity('PAGO')).toBe('success');
    expect(component.rotuloStatus('PENDENTE')).toBe('Pendente');
    expect(component.rotuloStatus('ATRASADO')).toBe('Atrasado');
    expect(component.rotuloStatus('PAGO')).toBe('Pago');
  });
});
