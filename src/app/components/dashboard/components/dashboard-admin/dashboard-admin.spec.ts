import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { adminFixture } from '../../testing/dashboard.fixtures';
import { DashboardAdmin } from './dashboard-admin';

describe('DashboardAdmin', () => {
  let fixture: ComponentFixture<DashboardAdmin>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/dashboard/admin`;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DashboardAdmin], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()] });
    http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(DashboardAdmin); fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('diálogos destacam totais reais, preservam zeros e oferecem acesso ao módulo', () => {
    http.expectOne(url).flush(adminFixture); fixture.detectChanges();
    const casos = [
      { tipo: 'alunos', total: 1, valores: [0, 0, 1, 0], rota: '/alunos' },
      { tipo: 'frota', total: 1, valores: [1, 0, 0, 0, 0], rota: '/onibus' },
      { tipo: 'viagens', total: 1, valores: [1, 0], rota: '/grades' },
      { tipo: 'manutencao', total: 0, valores: [0, 0, 0], rota: '/manutencao' },
    ] as const;
    for (const caso of casos) {
      fixture.componentInstance.detalheOperacao.set(caso.tipo); fixture.detectChanges();
      const resumo = fixture.componentInstance.resumoOperacao()!;
      expect(resumo.total).toBe(caso.total);
      expect(resumo.itens.map(item => item.valor)).toEqual([...caso.valores]);
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog.querySelector('.detalhe-destaque')!.textContent).toContain('Posição atual');
      expect(dialog.querySelectorAll('.detalhe-campo').length).toBe(caso.valores.length);
      expect(dialog.querySelector('a[href="' + caso.rota + '"]')).not.toBeNull();
      (dialog.querySelector('.detalhe-rodape button') as HTMLButtonElement).click(); fixture.detectChanges();
      expect(fixture.componentInstance.resumoOperacao()).toBeNull();
    }
  });
  it('pendências alternam receber e pagar sem nova chamada HTTP', () => {
    const dados = structuredClone(adminFixture);
    dados.financeiro.pendenciasReceber = [{ id: 1, nomePessoa: 'Ana', descricao: 'Mensalidade', valor: 230, dataVencimento: '2026-10-12', status: 'PENDENTE', situacao: 'VENCE_HOJE' }];
    dados.financeiro.pendenciasPagar = [{ id: 2, nomePessoa: 'João', descricao: 'Salário', valor: 900, dataVencimento: null, status: 'PENDENTE', situacao: 'SEM_VENCIMENTO' }];
    http.expectOne(url).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mensalidade');
    expect(fixture.nativeElement.textContent).not.toContain('Salário');
    const botao = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b: any) => b.textContent.trim() === 'A pagar') as HTMLButtonElement;
    botao.click(); fixture.detectChanges();
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Salário');
    expect(fixture.nativeElement.textContent).not.toContain('Mensalidade');
    http.expectNone(req => req.url === url);
  });
  it('tabela acessível do gráfico começa recolhida e pode ser aberta', () => {
    http.expectOne(url).flush(adminFixture); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#serie-mensal')).toBeNull();
    const botao = fixture.nativeElement.querySelector('[aria-controls="serie-mensal"]') as HTMLButtonElement;
    botao.click(); fixture.detectChanges();
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('#serie-mensal tbody tr').length).toBe(6);
    botao.click(); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('#serie-mensal')).toBeNull();
  });
  it('detalhes preservam todos os indicadores operacionais', () => {
    http.expectOne(url).flush(adminFixture); fixture.detectChanges();
    for (const tipo of ['alunos', 'frota', 'viagens', 'manutencao'] as const) {
      fixture.componentInstance.detalheOperacao.set(tipo); fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    }
    expect(fixture.nativeElement.textContent).toContain('Prioridade alta pendente');
    fixture.componentInstance.detalheOperacao.set(null); fixture.detectChanges();
  });
  it('mês inicial vem do servidor, mostra saldo negativo e série de seis meses', () => {
    http.expectOne(url).flush(adminFixture); fixture.detectChanges();
    expect(fixture.componentInstance.mes.value).toBe('2026-10');
    expect(fixture.componentInstance.grafico().labels.length).toBe(6);
    expect(fixture.componentInstance.grafico().datasets[0].data).toEqual([0, 0, 0, 0, 0, 0]);
    expect(fixture.nativeElement.textContent).toContain('Saldo das movimentações');
    expect(fixture.nativeElement.textContent).toContain('-R$');
    expect(fixture.nativeElement.textContent).toContain('Posição atual');
    expect(fixture.nativeElement.querySelector('a[href="/contas-receber"]')).not.toBeNull();
  });
  it('não consulta mês inválido', () => {
    http.expectOne(url).flush(adminFixture);
    for (const valor of ['2026-13', '0000-01', '', '2026-1']) fixture.componentInstance.alterarMes(valor);
    http.expectNone(req => req.url === url);
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Selecione um mês válido');
  });
  it('troca rápida cancela consulta anterior e não relabela dados antigos', () => {
    http.expectOne(url).flush(adminFixture);
    fixture.componentInstance.alterarMes('2026-09'); const anterior = http.expectOne(`${url}?mes=2026-09`);
    fixture.componentInstance.alterarMes('2026-08'); const atual = http.expectOne(`${url}?mes=2026-08`);
    expect(anterior.cancelled).toBeTrue(); expect(fixture.componentInstance.consulta.dados()).toBeNull();
    expect(fixture.componentInstance.consulta.carregando()).toBeTrue();
    atual.flush({ ...adminFixture, mes: '2026-08' }); expect(fixture.componentInstance.consulta.dados()?.mes).toBe('2026-08');
  });
  it('erro de consulta não encerra futuras atualizações', () => {
    http.expectOne(url).flush({}, { status: 500, statusText: 'Erro' });
    expect(fixture.componentInstance.consulta.erro()).not.toBeNull();
    fixture.componentInstance.alterarMes('2026-09');
    http.expectOne(`${url}?mes=2026-09`).flush({ ...adminFixture, mes: '2026-09' });
    expect(fixture.componentInstance.consulta.erro()).toBeNull(); expect(fixture.componentInstance.consulta.dados()?.mes).toBe('2026-09');
  });

  it('chamado abre somente o filtro de ônibus e não ação financeira', () => {
    const dados = structuredClone(adminFixture);
    dados.operacao.chamadosPendentes = [{ id: 3, descricao: 'Ar quebrado', dataAbertura: '2026-10-10', urgencia: 'ALTA', status: 'ABERTO',
      onibusId: 7, numeroIdentificacao: '07', placa: 'ABC7777', solicitanteNome: 'Ana' }];
    http.expectOne(url).flush(dados); fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/manutencao?onibusId=7"]');
    expect(link).not.toBeNull(); expect(link.textContent).toContain('Ver chamados deste ônibus');
    expect(fixture.nativeElement.textContent).toContain('Ar quebrado');
    expect(fixture.nativeElement.textContent).not.toContain('Pagar mensalidade');
  });
});
