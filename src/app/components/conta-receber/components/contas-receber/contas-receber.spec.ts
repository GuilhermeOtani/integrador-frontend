import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber } from '../../models/conta-receber';
import { ContasReceber } from './contas-receber';
import { By } from '@angular/platform-browser';
import { Table } from 'primeng/table';

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
      competencia: '2026-09', valorRecebido: 0, saldoRestante: 250, recebimentoParcial: false, avisos: [],
    },
    {
      id: 2,
      descricao: 'Mensalidade agosto/2026',
      valor: 250,
      dataVencimento: '2026-08-30',
      status: 'ATRASADO',
      alunoId: 11,
      nomeAluno: 'Aluno Atrasado',
      competencia: '2026-08', valorRecebido: 50, saldoRestante: 200, recebimentoParcial: true, avisos: [],
    },
    {
      id: 3,
      descricao: 'Mensalidade julho/2026',
      valor: 250,
      dataVencimento: '2026-07-30',
      status: 'PAGO',
      alunoId: 12,
      nomeAluno: 'Aluno Pago',
      competencia: '2026-07', valorRecebido: 250, saldoRestante: 0, recebimentoParcial: false, avisos: [],
    },
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<ContaReceberService>('ContaReceberService', ['listarTodas', 'buscar', 'excluir']);

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
  it('usa painel e tabela sem zebra, ações por ícone e nenhuma ação de pagar como ADMIN', () => {
    criarComResposta(of(contas));
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('Contas a receber'); expect(fixture.nativeElement.querySelector('.app-tabela-painel .app-tabela-ferramentas')).not.toBeNull();
    const tabela = fixture.debugElement.query(By.directive(Table)).componentInstance as Table; expect(tabela.stripedRows).not.toBeTrue(); expect(tabela.rowHover).toBeTrue(); expect(fixture.nativeElement.querySelector('.p-datatable-striped')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tbody button').length).toBe(4);
    expect(fixture.nativeElement.querySelector('button[aria-label="Editar cobrança 1"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Pagar conta');
  });
  it('pesquisa mantém o filtro por aluno/descrição/status e aceita acentos', () => {
    criarComResposta(of([{ ...contas[0], nomeAluno: 'João' }, contas[1], contas[2]])); component.primeiraLinha.set(20); component.pesquisar('joao');
    expect(component.contasVisiveis().map(c => c.id)).toEqual([1]); expect(component.primeiraLinha()).toBe(0);
    component.pesquisar(''); component.primeiraLinha.set(10); component.selecionarHistorico(true); expect(component.primeiraLinha()).toBe(0); expect(component.contasVisiveis().map(c => c.id)).toEqual([3]);
    expect(service.listarTodas).toHaveBeenCalledTimes(1);
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
  it('reconsulta antes da exclusão e bloqueia quitação/recebimentos, sem DELETE', () => {
    criarComResposta(of(contas)); service.buscar.and.returnValue(of(contas[1])); component.prepararExclusao(contas[1]);
    expect(component.exclusao()).toBeNull(); expect(component.avisoOperacao()).toContain('Exclusão bloqueada'); expect(service.excluir).not.toHaveBeenCalled();
    service.buscar.and.returnValue(of(contas[2])); component.prepararExclusao(contas[2]); expect(component.exclusao()).toBeNull();
  });
  it('só exclui após confirmação e não repete em conflito com recebimento concorrente', () => {
    criarComResposta(of(contas)); service.buscar.and.returnValue(of(contas[0])); component.prepararExclusao(contas[0]);
    expect(service.excluir).not.toHaveBeenCalled(); expect(component.exclusao()?.id).toBe(1);
    service.excluir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Possui recebimento.' } })));
    component.confirmarExclusao(); expect(service.excluir).toHaveBeenCalledOnceWith(1); expect(component.exclusao()).toBeNull();
    expect(component.avisoOperacao()).toBe('Possui recebimento.'); expect(service.listarTodas).toHaveBeenCalledTimes(2);
  });
  it('conta sem vínculos pode ser excluída e lista é atualizada', () => {
    criarComResposta(of(contas)); service.buscar.and.returnValue(of(contas[0])); service.excluir.and.returnValue(of(undefined));
    component.prepararExclusao(contas[0]); component.confirmarExclusao(); expect(component.exclusao()).toBeNull(); expect(service.listarTodas).toHaveBeenCalledTimes(2);
  });
});
