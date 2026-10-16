import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Relatorios } from './relatorios';
import { environment } from '../../../../../environments/environment';
import { acertoFixture, baseFixture, fluxoFixture, inadimplenciaFixture } from '../../testing/relatorios.fixtures';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
import { By } from '@angular/platform-browser';
import { Table } from 'primeng/table';
describe('Relatorios', () => {
  let fixture: ComponentFixture<Relatorios>; let c: Relatorios; let http: HttpTestingController;
  const base = environment.apiUrl;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Relatorios], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] });
    http = TestBed.inject(HttpTestingController); fixture = TestBed.createComponent(Relatorios); c = fixture.componentInstance; fixture.detectChanges();
    http.expectOne(`${base}/aluno/listar?situacao=TODOS`).flush([{ id: 7, nome: 'João', arquivado: true }]);
    http.expectOne(`${base}/motorista/listar`).flush([{ id: 42, nome: 'José' }]); fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify({ ignoreCancelled: true }); });
  function fluxo(): void { c.form.controls.tipo.setValue('fluxo-caixa'); fixture.detectChanges(); http.expectOne(`${base}/financeiro/saldo-base`).flush(baseFixture); fixture.detectChanges(); }
  it('inicia sem consultar relatórios e inclui alunos arquivados nas opções', () => {
    expect(c.tipo()).toBe('inadimplencia'); expect(c.resultado()).toBeNull(); expect(c.alunos()[0].label).toContain('Arquivado');
    http.expectNone(r => r.url.includes('/relatorios/')); expect(fixture.nativeElement.textContent).toContain('clique em Consultar');
  });
  it('consulta inadimplência somente ao confirmar e mostra totais do servidor', () => {
    c.consultar(); expect(c.form.disabled).toBeTrue(); const r = http.expectOne(`${base}/relatorios/inadimplencia`);
    const dados = inadimplenciaFixture(); dados.totalGeral = 999; r.flush(dados); fixture.detectChanges();
    expect(c.form.enabled).toBeTrue(); const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('999,00'); expect(texto).toContain('Arquivado'); expect(texto).toContain('16/10/2026'); expect(texto).toContain('10/10/2026');
  });
  it('inadimplência exibe saldo da parcela e totais do backend, sem refazer a contabilidade', () => {
    c.consultar(); const dados = inadimplenciaFixture();
    Object.assign(dados.alunos[0].cobrancas[0], { valor: 300, valorRecebido: 100, saldoRestante: 200, recebimentoParcial: true, competencia: '2026-09', avisos: ['RECEBIMENTO_NEGATIVO_LEGADO', 'NOVO_CODIGO'] });
    dados.totalGeral = 190; dados.alunos[0].total = 190;
    http.expectOne(`${base}/relatorios/inadimplencia`).flush(dados); fixture.detectChanges();
    const celulas = fixture.nativeElement.querySelectorAll('tbody td'); expect(celulas[celulas.length - 1].textContent).toContain('200,00');
    for (const texto of ['300,00', '100,00', '190,00', 'Parcial', '2026-09', 'negativo exige revisão', 'NOVO_CODIGO']) expect(fixture.nativeElement.textContent).toContain(texto);
  });
  it('preserva seleção quando o nome vem do resultado e não do cadastro', () => {
    c.form.controls.alunoId.setValue(99); c.consultar(); const dados = inadimplenciaFixture(); dados.alunoId = 99; dados.alunos[0].alunoId = 99;
    http.expectOne(`${base}/relatorios/inadimplencia?alunoId=99`).flush(dados);
    expect(c.form.controls.alunoId.value).toBe(99); expect(c.alunos().some(a => a.id === 99)).toBeTrue();
  });
  it('alterar filtros limpa os resultados sem executar outra consulta', () => {
    c.consultar(); http.expectOne(`${base}/relatorios/inadimplencia`).flush(inadimplenciaFixture());
    c.form.controls.vencimentoInicio.setValue('2026-10-01'); expect(c.resultado()).toBeNull(); http.expectNone(r => r.url.includes('/relatorios/'));
  });
  it('bloqueia períodos invertidos, datas inválidas e IDs zero', () => {
    c.form.patchValue({ vencimentoInicio: '2026-10-31', vencimentoFim: '2026-10-01' }); c.consultar(); expect(c.erro()).toContain('inicial');
    c.form.patchValue({ vencimentoInicio: '2026-02-29', vencimentoFim: '' }); c.consultar(); expect(c.erro()).toContain('válidas');
    c.form.patchValue({ vencimentoInicio: '', alunoId: 0 }); c.consultar(); expect(c.erro()).toContain('aluno'); http.expectNone(r => r.url.includes('/relatorios/'));
  });
  it('dados vazios continuam sendo um resultado válido e permitem PDF', () => {
    c.consultar(); http.expectOne(`${base}/relatorios/inadimplencia`).flush({ ...inadimplenciaFixture(), alunos: [], quantidadeCobrancas: 0, totalGeral: 0 }); fixture.detectChanges();
    expect(c.resultado()).not.toBeNull(); expect(fixture.nativeElement.textContent).toContain('Nenhuma mensalidade'); expect(c.validacao()).toBe('');
  });
  it('não interpreta HTML e não troca valor nulo por zero', () => {
    c.consultar(); const dados = inadimplenciaFixture(); dados.alunos[0].nome = '<img src=x onerror=alert(1)>'; dados.alunos[0].cobrancas[0].valor = null; dados.avisos = ['Revisar dados antigos'];
    http.expectOne(`${base}/relatorios/inadimplencia`).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('<img src=x'); expect(fixture.nativeElement.querySelector('img')).toBeNull(); expect(fixture.nativeElement.textContent).toContain('Não informado'); expect(fixture.nativeElement.textContent).toContain('Revisar dados antigos');
  });
  it('falha HTTP limpa resultado e permite tentar consultar novamente', () => {
    c.consultar(); http.expectOne(`${base}/relatorios/inadimplencia`).flush({ detail: 'Falha de consulta' }, { status: 500, statusText: 'Erro' });
    expect(c.resultado()).toBeNull(); expect(c.form.enabled).toBeTrue(); expect(c.erro()).toBe('Falha de consulta');
    c.consultar(); http.expectOne(`${base}/relatorios/inadimplencia`).flush(inadimplenciaFixture()); expect(c.resultado()).not.toBeNull();
  });
  it('duplo clique não cria duas consultas e download não concorre com consulta', () => {
    c.consultar(); c.consultar(); c.baixar(); const r = http.expectOne(`${base}/relatorios/inadimplencia`); http.expectNone(r => r.url.endsWith('/pdf')); expect(c.carregando()).toBeTrue(); r.flush(inadimplenciaFixture());
  });
  it('fluxo mantém as duas linhas com IDs iguais e a ordem dos saldos', () => {
    fluxo(); c.form.patchValue({ dataInicio: '2026-10-01', dataFim: '2026-10-31' }); c.consultar();
    http.expectOne(`${base}/relatorios/fluxo-caixa?dataInicio=2026-10-01&dataFim=2026-10-31`).flush(fluxoFixture()); fixture.detectChanges();
    const linhas = fixture.nativeElement.querySelectorAll('.movimentos tbody tr'); expect(linhas.length).toBe(2);
    const tabela = fixture.debugElement.query(By.directive(Table)).componentInstance as Table; expect(tabela.stripedRows).not.toBeTrue(); expect(tabela.rowHover).toBeTrue(); expect(fixture.nativeElement.querySelector('.p-datatable-striped')).toBeNull();
    expect(c.chaveMovimento(0, fluxoFixture().movimentos[0])).not.toBe(c.chaveMovimento(1, fluxoFixture().movimentos[1]));
    expect(linhas[0].textContent).toContain('Recebimento #12'); expect(linhas[0].textContent).toContain('2.600,00'); expect(linhas[1].textContent).toContain('Pagamento #12'); expect(linhas[1].textContent).toContain('2.000,00');
  });
  it('fluxo bloqueia início anterior ao saldo base e não abre configuração por 404 de relatório', () => {
    fluxo(); c.form.patchValue({ dataInicio: '2026-09-30', dataFim: '2026-10-16' }); c.consultar(); expect(c.erro()).toContain('saldo base');
    c.form.controls.dataInicio.setValue('2026-10-01'); c.consultar(); http.expectOne(r => r.url.endsWith('/relatorios/fluxo-caixa')).flush({ detail: 'Não encontrado' }, { status: 404, statusText: 'Not Found' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
  it('acerto usa competência e mostra totais legados sem refazer a diferença', () => {
    c.form.patchValue({ tipo: 'acerto-motoristas', mes: '2026-10', motoristaId: 42 }); c.consultar(); const dados = acertoFixture(); dados.saldoAPagar = 123; dados.motoristas[0].lancamentos[0].avisos = ['QUITACAO_SEM_COMPROVANTE', 'NOVO_CODIGO'];
    http.expectOne(`${base}/relatorios/acerto-motoristas?mes=2026-10&motoristaId=42`).flush(dados); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('123,00'); expect(fixture.nativeElement.textContent).toContain('Parcial'); expect(fixture.nativeElement.textContent).toContain('05/11/2026'); expect(fixture.nativeElement.textContent).toContain('sem comprovante'); expect(fixture.nativeElement.textContent).toContain('NOVO_CODIGO');
  });
  it('mês inválido bloqueia consulta de acerto', () => {
    c.form.patchValue({ tipo: 'acerto-motoristas', mes: '2026-13' }); c.consultar(); expect(c.erro()).toContain('competência'); http.expectNone(r => r.url.includes('/relatorios/'));
  });
  it('PDF pode ser baixado antes de consultar, com filtros bloqueados durante o download', fakeAsync(() => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:relatorio'); spyOn(URL, 'revokeObjectURL'); spyOn(HTMLAnchorElement.prototype, 'click');
    c.baixar(); expect(c.baixando()).toBeTrue(); expect(c.carregando()).toBeFalse(); expect(c.form.disabled).toBeTrue();
    http.expectOne(`${base}/relatorios/inadimplencia/pdf`).flush(new Blob(['pdf'])); expect(c.form.enabled).toBeTrue(); expect(c.resultado()).toBeNull(); tick(1000);
  }));
  it('invalidação financeira cancela uma consulta em andamento e limpa dados', () => {
    c.consultar(); const req = http.expectOne(`${base}/relatorios/inadimplencia`); TestBed.inject(FinanceiroEventos).invalidar();
    expect(req.cancelled).toBeTrue(); expect(c.resultado()).toBeNull(); expect(c.carregando()).toBeFalse(); expect(c.form.enabled).toBeTrue();
  });
  it('destruição cancela leitura pendente', () => {
    c.consultar(); const req = http.expectOne(`${base}/relatorios/inadimplencia`); fixture.destroy(); expect(req.cancelled).toBeTrue();
  });
  it('fluxo vazio preserva os quatro totais retornados', () => {
    fluxo(); c.form.patchValue({ dataInicio: '2026-10-01', dataFim: '2026-10-31' }); c.consultar(); http.expectOne(r => r.url.endsWith('/relatorios/fluxo-caixa')).flush({ ...fluxoFixture(), movimentos: [], saldoInicial: -100, saldoFinal: -100, totalEntradas: 0, totalSaidas: 0 }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma movimentação'); expect(fixture.nativeElement.textContent).toContain('-R$'); expect(c.validacao()).toBe('');
  });
  it('acerto vazio apresenta estado válido sem esconder avisos', () => {
    c.form.patchValue({ tipo: 'acerto-motoristas', mes: '2026-10' }); c.consultar(); http.expectOne(`${base}/relatorios/acerto-motoristas?mes=2026-10`).flush({ ...acertoFixture(), motoristas: [], avisos: ['Regularize as contas sem competência.'], totalPrevisto: 0, totalPago: 0, saldoAPagar: 0 }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum lançamento'); expect(fixture.nativeElement.textContent).toContain('Regularize'); expect(c.resultado()).not.toBeNull();
  });
});
