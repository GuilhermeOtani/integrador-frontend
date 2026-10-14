import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { AgendaTransporte } from '../agenda-transporte/agenda-transporte';
import { environment } from '../../../../../environments/environment';
import { RecebimentoService } from '../../../conta-receber/service/recebimento-service';
import { ReciboMatricula } from '../../../conta-receber/models/conta-receber';
import { alunoFixture } from '../../testing/dashboard.fixtures';
import { DashboardAluno } from './dashboard-aluno';

describe('DashboardAluno', () => {
  let fixture: ComponentFixture<DashboardAluno>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/dashboard/aluno`;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DashboardAluno], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(), MessageService] });
    http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(DashboardAluno); fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('resumo separa cobrança, cadastro e valores zero sem alterar o pagamento', () => {
    http.expectOne(url).flush(alunoFixture); fixture.detectChanges();
    const pagamento = fixture.componentInstance.pagamento();
    fixture.componentInstance.resumoVisivel.set(true); fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.querySelector('.detalhe-destaque')!.textContent).toContain('230,00');
    for (const texto of ['250,00', '0,00', '2026001', 'Faculdade A', 'Rua A', '12/10/2026']) expect(dialog.textContent).toContain(texto);
    expect(dialog.querySelector('a[href="/minhas-matriculas"]')).not.toBeNull();
    (dialog.querySelector('.detalhe-rodape button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(fixture.componentInstance.resumoVisivel()).toBeFalse();
    expect(fixture.componentInstance.pagamento()).toBe(pagamento);
    http.expectNone(url);
  });
  it('seleção persiste mesmo recriando os cards após atualização', () => {
    const dados = structuredClone(alunoFixture);
    dados.transporte.agendaSemanal.push({ ...dados.transporte.viagensHoje[0], dataOcorrencia: '2026-10-13' });
    http.expectOne(url).flush(dados); fixture.detectChanges();
    const agenda = fixture.debugElement.query(By.directive(AgendaTransporte)).componentInstance as AgendaTransporte;
    agenda.selecionar('10:2026-10-13'); fixture.detectChanges();
    expect(fixture.componentInstance.viagemSelecionada()).toBe('10:2026-10-13');
    fixture.componentInstance.carregar(); fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AgendaTransporte))).toBeNull();
    http.expectOne(url).flush(dados); fixture.detectChanges();
    const recriada = fixture.debugElement.query(By.directive(AgendaTransporte)).componentInstance as AgendaTransporte;
    expect(recriada).not.toBe(agenda);
    expect(recriada.selecionada()!.dataOcorrencia).toBe('2026-10-13');
    expect((fixture.nativeElement.querySelector('#viagem-dashboard') as HTMLSelectElement).value).toBe('10:2026-10-13');
  });
  it('carrega faculdade, transporte e cobrança com valores distintos', () => {
    expect(fixture.componentInstance.consulta.carregando()).toBeTrue();
    http.expectOne(url).flush(alunoFixture); fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;
    for (const item of ['Ana', 'Faculdade A', 'ABC1234', '230,00', 'Vence hoje', '12/10/2026']) expect(texto).toContain(item);
    expect(texto).not.toContain('250,00');
    fixture.componentInstance.resumoVisivel.set(true); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('250,00');
  });
  it('faculdade ausente e transporte vazio preservam financeiro', () => {
    const dados = structuredClone(alunoFixture); dados.faculdade = null;
    dados.transporte = { viagensHoje: [], agendaSemanal: [], programacaoSemGrade: [], rotas: [] };
    dados.avisos = ['Sua faculdade não foi cadastrada.'];
    http.expectOne(url).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sua faculdade não foi cadastrada.');
    expect(fixture.nativeElement.textContent).toContain('230,00');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma viagem programada para hoje.');
  });
  it('cobrança ausente não oferece pagar ou recibo', () => {
    const dados = structuredClone(alunoFixture); dados.financeiro.cobrancaPrincipal = null; dados.financeiro.mensalidadeCadastro = null;
    http.expectOne(url).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma cobrança cadastrada.');
    expect(fixture.nativeElement.textContent).not.toContain('Pagar mensalidade');
    expect(fixture.nativeElement.textContent).not.toContain('Ver recibo');
    fixture.componentInstance.resumoVisivel.set(true); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não informado');
  });
  for (const status of [0, 403, 500]) {
    it(`erro ${status} não vira estado vazio ou mantém dados antigos`, () => {
      http.expectOne(url).flush(alunoFixture); fixture.detectChanges();
      fixture.componentInstance.carregar();
      const req = http.expectOne(url);
      if (status === 0) req.error(new ProgressEvent('error')); else req.flush({ detail: 'Falha de consulta' }, { status, statusText: 'Erro' });
      fixture.detectChanges();
      expect(fixture.componentInstance.consulta.erro()).not.toBeNull();
      expect(fixture.componentInstance.consulta.dados()).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('ABC1234');
      expect(fixture.nativeElement.textContent).not.toContain('Nenhuma viagem');
    });
  }
  it('recibo sobrevive à atualização e à falha após pagamento', () => {
    http.expectOne(url).flush(alunoFixture); fixture.detectChanges();
    const recibo: ReciboMatricula = { id: 1, contaId: 42, valor: 230, dataRecebimento: '2026-10-12', formaPagamento: 'PIX', nomeAluno: 'Ana', descricaoConta: 'Mensalidade Ana' };
    spyOn(TestBed.inject(RecebimentoService), 'pagar').and.returnValue(of(recibo));
    const pagamento = fixture.componentInstance.pagamento();
    pagamento.abrirPagamento(alunoFixture.financeiro.cobrancaPrincipal!); pagamento.confirmarPagamento(); fixture.detectChanges();
    expect(fixture.componentInstance.consulta.carregando()).toBeTrue();
    expect(fixture.componentInstance.pagamento()).toBe(pagamento); expect(pagamento.recibo()).toEqual(recibo);
    http.expectOne(url).flush({}, { status: 500, statusText: 'Erro' }); fixture.detectChanges();
    expect(pagamento.recibo()).toEqual(recibo);
    expect(fixture.nativeElement.textContent).toContain('Pagamento registrado; não foi possível atualizar o painel.');
  });
  it('conta sem valor ou vencimento não oferece pagamento', () => {
    const dados = structuredClone(alunoFixture); dados.financeiro.cobrancaPrincipal!.valor = null;
    http.expectOne(url).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cobrança incompleta');
    expect(fixture.nativeElement.textContent).not.toContain('Pagar mensalidade');
  });

  for (const caso of [
    { situacao: 'VENCIDA' as const, dias: -4, status: 'PENDENTE' as const, texto: 'Vencida há 4 dias', pagar: true, recibo: false },
    { situacao: 'A_VENCER' as const, dias: 5, status: 'PENDENTE' as const, texto: 'Vence em 5 dias', pagar: true, recibo: false },
    { situacao: 'PAGO' as const, dias: null, status: 'PAGO' as const, texto: 'Pago', pagar: false, recibo: true },
    { situacao: 'SEM_VENCIMENTO' as const, dias: null, status: 'PENDENTE' as const, texto: 'Sem vencimento', pagar: false, recibo: false },
  ]) {
    it(`apresenta situação ${caso.situacao} e ações corretas`, () => {
      const dados = structuredClone(alunoFixture);
      Object.assign(dados.financeiro.cobrancaPrincipal!, { situacao: caso.situacao, diasParaVencimento: caso.dias, status: caso.status });
      if (caso.situacao === 'SEM_VENCIMENTO') dados.financeiro.cobrancaPrincipal!.dataVencimento = null;
      http.expectOne(url).flush(dados); fixture.detectChanges();
      const texto = fixture.nativeElement.textContent as string;
      expect(texto).toContain(caso.texto);
      expect(texto.includes('Pagar mensalidade')).toBe(caso.pagar);
      expect(texto.includes('Ver recibo')).toBe(caso.recibo);
    });
  }
});
