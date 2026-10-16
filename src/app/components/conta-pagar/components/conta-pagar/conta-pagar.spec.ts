import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { ContaPagarComponent } from './conta-pagar';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { environment } from '../../../../../environments/environment';
import { contaFixture, reciboFixture } from '../../../relatorios/testing/relatorios.fixtures';
import { ContaPagarResponse } from '../../../relatorios/models/relatorios.models';
import { IntencaoPagamento, PagamentoPendente } from '../../utils/pagamento-pendente';
import { By } from '@angular/platform-browser';
import { Table } from 'primeng/table';
describe('Contas a pagar', () => {
  let fixture: ComponentFixture<ContaPagarComponent>; let c: ContaPagarComponent; let http: HttpTestingController;
  const usuario = signal({ id: 1, tipoPessoa: 'ADMIN' }); const base = environment.apiUrl;
  const buscar = `${base}/contapagar/buscar-contapagar/123`; const lista = `${base}/contapagar/listar`; const recibos = `${base}/pagamentos/conta/123`;
  const storage = new PagamentoPendente(1);
  const intencao: IntencaoPagamento = { versao: 1, adminId: 1, contaId: 123, formaPagamento: 'PIX', valorPago: 600, chave: '3d639dfb-0b3c-48a7-8fc5-9571ed38517d', estado: 'INCERTA' };
  beforeEach(() => {
    storage.salvar(null); usuario.set({ id: 1, tipoPessoa: 'ADMIN' });
    TestBed.configureTestingModule({ imports: [ContaPagarComponent], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), { provide: AuthService, useValue: { usuario, temPapel: (p: string) => usuario().tipoPessoa === p } }] });
    http = TestBed.inject(HttpTestingController);
  });
  function iniciar(contas = [contaFixture()]): void { fixture = TestBed.createComponent(ContaPagarComponent); c = fixture.componentInstance; fixture.detectChanges(); http.expectOne(lista).flush(contas); fixture.detectChanges(); }
  function abrir(): void { c.abrirModalPagamento(contaFixture()); http.expectOne(buscar).flush(contaFixture()); }
  function confirmar() { c.pagamentoForm.controls.valor.setValue(600); c.confirmarPagamento(); http.expectOne(buscar).flush(contaFixture()); return http.expectOne(r => r.url === `${base}/pagamentos/realizar/123`); }
  function concluirAtualizacao(): void { const conta = { ...contaFixture(), valorPago: 1200, saldoRestante: 1800 }; http.expectOne(lista).flush([conta]); http.expectOne(buscar).flush(conta); http.expectOne(recibos).flush([{ ...reciboFixture, id: 13 }, reciboFixture]); }
  afterEach(() => { fixture?.destroy(); http.verify({ ignoreCancelled: true }); storage.salvar(null); });
  it('mostra original, pago e saldo sem usar valor original como pagamento inicial', () => {
    iniciar(); abrir(); expect(c.pagamentoForm.controls.valor.value).toBe(2400); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Parcial'); expect(fixture.nativeElement.textContent).toContain('2.400,00');
  });
  it('usa tabela PrimeNG sem zebra e ações circulares somente com ícones acessíveis', () => {
    iniciar(); const tabela = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(tabela.stripedRows).not.toBeTrue(); expect(tabela.rowHover).toBeTrue(); expect(fixture.nativeElement.querySelector('.p-datatable-striped')).toBeNull();
    const botoes = [...fixture.nativeElement.querySelectorAll('.app-acoes-linha button')] as HTMLButtonElement[];
    expect(botoes.map(b => b.getAttribute('aria-label'))).toEqual(['Pagar conta 123', 'Ver comprovantes da conta 123', 'Editar conta 123', 'Excluir conta 123']);
    for (const b of botoes) { expect(b.classList.contains('p-button-rounded')).toBeTrue(); expect(b.classList.contains('p-button-outlined')).toBeTrue(); expect(b.querySelector('.p-button-label')?.textContent?.trim() ?? '').toBe(''); }
  });
  it('ícone de pagar apenas abre a confirmação; não executa pagamento', () => {
    iniciar(); (fixture.nativeElement.querySelector('button[aria-label="Pagar conta 123"]') as HTMLButtonElement).click(); http.expectOne(buscar).flush(contaFixture());
    expect(c.exibirModalPagamento).toBeTrue(); http.expectNone(r => r.method === 'POST');
  });
  it('pesquisa aceita nome sem acento e volta à primeira página', () => {
    iniciar(); c.primeiraLinha.set(20); c.pesquisar('jose'); expect(c.visiveis().length).toBe(1); expect(c.primeiraLinha()).toBe(0);
    c.primeiraLinha.set(10); c.selecionarHistorico(true); expect(c.primeiraLinha()).toBe(0);
  });
  it('abrir e cancelar não executa pagamento', () => { iniciar(); abrir(); c.exibirModalPagamento = false; http.expectNone(r => r.method === 'POST'); });
  it('bloqueia pagamento zero, negativo, fração de centavo e maior que saldo', () => {
    iniciar(); abrir(); for (const valor of [0, -1, 0.001, 2401]) { c.pagamentoForm.controls.valor.setValue(valor); c.confirmarPagamento(); expect(c.erroPagamento()).not.toBe(''); }
    http.expectNone(r => r.method === 'POST'); http.expectNone(buscar);
  });
  it('revalida saldo antes de pagar e não registra valor que ficou maior', () => {
    iniciar(); abrir(); c.confirmarPagamento(); http.expectOne(buscar).flush({ ...contaFixture(), saldoRestante: 100 }); expect(c.erroPagamento()).toContain('saldo foi alterado'); http.expectNone(r => r.method === 'POST');
  });
  it('gera chave uma vez e duplo clique não envia dois pagamentos', () => {
    iniciar(); abrir(); const r = confirmar(); c.confirmarPagamento(); c.repetirPagamento(); expect(r.request.params.get('valorPago')).toBe('600'); expect(r.request.headers.get('Idempotency-Key')).toBe(c.pendente()!.chave);
    r.flush({ id: 13 }); concluirAtualizacao(); expect(c.pendente()).toBeNull(); expect(c.contas()[0].saldoRestante).toBe(1800); expect(c.recibos().length).toBe(2);
  });
  for (const status of [0, 500, 409]) {
    it(`resultado ${status} mantém chave e parâmetros na repetição explícita`, () => {
      iniciar(); abrir(); const r = confirmar(); const chave = r.request.headers.get('Idempotency-Key')!;
      if (status === 0) r.error(new ProgressEvent('error')); else r.flush({}, { status, statusText: 'Erro' });
      expect(c.pendente()!.chave).toBe(chave); c.repetirPagamento(); const repeticao = http.expectOne(req => req.method === 'POST'); expect(repeticao.request.headers.get('Idempotency-Key')).toBe(chave); expect(repeticao.request.params.toString()).toBe(r.request.params.toString()); repeticao.flush({ id: 13 }); concluirAtualizacao();
    });
  }
  it('recarregar restaura pendência e não repete automaticamente', () => {
    storage.salvar(intencao); iniciar(); expect(c.pendente()).toEqual(intencao); http.expectNone(r => r.method === 'POST');
    c.retomar(); http.expectOne(buscar).flush(contaFixture()); http.expectOne(recibos).flush([reciboFixture]); expect(c.conferida()).toBeTrue(); expect(c.pagamentoForm.disabled).toBeTrue();
  });
  it('retentativa restaurada mantém valor omitido mesmo com saldo atual diferente', () => {
    const { valorPago, ...i } = intencao; storage.salvar(i); iniciar(); c.repetirPagamento(); const r = http.expectOne(req => req.method === 'POST'); expect(r.request.params.has('valorPago')).toBeFalse(); expect(r.request.headers.get('Idempotency-Key')).toBe(i.chave); r.flush({ id: 13 }); concluirAtualizacao();
  });
  it('sucesso com falha de atualização não permite outro POST nem outra chave', () => {
    iniciar(); abrir(); confirmar().flush({ id: 13 }); http.expectOne(lista).flush({}, { status: 500, statusText: 'Erro' }); http.match(buscar); http.match(recibos);
    expect(c.pendente()?.estado).toBe('REGISTRADA'); expect(c.erroPagamento()).toContain('Pagamento registrado'); c.repetirPagamento(); c.confirmarPagamento(); http.expectNone(r => r.method === 'POST');
    c.atualizarConfirmado(); concluirAtualizacao(); expect(c.pendente()).toBeNull(); expect(storage.ler().tipo).toBe('ausente');
  });
  it('pendência registrada restaurada apenas atualiza consultas', () => {
    storage.salvar({ ...intencao, estado: 'REGISTRADA' }); iniciar(); c.retomar(); concluirAtualizacao(); http.expectNone(r => r.method === 'POST'); expect(c.pendente()).toBeNull();
  });
  it('pendência incerta só é encerrada após leitura e confirmação consciente', () => {
    storage.salvar(intencao); iniciar(); c.encerrarPendencia(); expect(c.pendente()).not.toBeNull(); c.retomar(); http.expectOne(buscar).flush(contaFixture()); http.expectOne(recibos).flush([reciboFixture]); c.encerrarPendencia(); expect(c.pendente()).not.toBeNull(); c.conferencia.setValue(true); c.encerrarPendencia(); http.expectOne(lista).flush([contaFixture()]); expect(c.pendente()).toBeNull(); http.expectNone(r => r.method === 'POST');
  });
  it('armazenamento corrompido bloqueia novas intenções', () => {
    sessionStorage.setItem(storage.chave, '{invalido'); iniciar(); expect(c.problemaStorage()).toBeTrue(); c.abrirModalPagamento(contaFixture()); http.expectNone(buscar); http.expectNone(r => r.method === 'POST');
  });
  it('erro conclusivo 400 permite revisar sem manter intenção anterior', () => {
    iniciar(); abrir(); confirmar().flush({ detail: 'Valor inválido' }, { status: 400, statusText: 'Bad Request' }); expect(c.pendente()).toBeNull(); expect(storage.ler().tipo).toBe('ausente'); expect(c.pagamentoForm.enabled).toBeTrue();
  });
  it('resposta 2xx sem identificador é tratada como incerta', () => {
    iniciar(); abrir(); confirmar().flush(null); expect(c.pendente()?.estado).toBe('INCERTA'); expect(c.erroPagamento()).toContain('inesperada'); http.expectNone(lista);
  });
  it('falha ao guardar chave impede POST', () => {
    iniciar(); abrir(); spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado'); c.confirmarPagamento(); http.expectOne(buscar).flush(contaFixture()); http.expectNone(r => r.method === 'POST'); expect(c.erroPagamento()).toContain('Nenhum pagamento');
  });
  it('todos os comprovantes ficam disponíveis em conta parcial, inclusive valores zero e negativos', () => {
    iniciar(); c.abrirModalRecibo(contaFixture()); http.expectOne(recibos).flush([{ ...reciboFixture, id: 14, valor: 0 }, { ...reciboFixture, id: 13, valor: -10 }, reciboFixture]); fixture.detectChanges();
    expect(c.recibos().map(r => r.id)).toEqual([14, 13, 12]); c.verRecibo(c.recibos()[1]); expect(c.recibo()?.valor).toBe(-10); expect(c.protegido(contaFixture())).toBeTrue();
  });
  it('bloqueia avisos impeditivos mas não usa status PAGO sozinho para saldo divergente', () => {
    iniciar(); for (const aviso of ['VALOR_INVALIDO', 'PAGAMENTO_NEGATIVO_LEGADO', 'PAGAMENTO_SUPERIOR_A_CONTA', 'QUITACAO_SEM_COMPROVANTE']) expect(c.podePagar({ ...contaFixture(), avisos: [aviso] })).toBeFalse();
    expect(c.podePagar({ ...contaFixture(), status: 'PAGO', avisos: ['STATUS_DIVERGENTE'] })).toBeTrue();
  });
  it('comprovante de valor zero impede exclusão após verificação', () => {
    const conta: ContaPagarResponse = { ...contaFixture(), valorPago: 0, pagamentoParcial: false, saldoRestante: 3000 }; iniciar([conta]); c.solicitarExclusao(conta);
    http.expectOne(buscar).flush(conta); http.expectOne(recibos).flush([{ ...reciboFixture, valor: 0 }]); http.expectOne(lista).flush([conta]); expect(c.prontoExcluir()).toBeNull(); expect(c.protegido(conta)).toBeTrue(); http.expectNone(r => r.method === 'DELETE');
  });
  it('exclusão só ocorre após consulta e confirmação; conflito recarrega sem repetir', () => {
    const conta = { ...contaFixture(), valorPago: 0, pagamentoParcial: false }; iniciar([conta]); c.solicitarExclusao(conta); http.expectOne(buscar).flush(conta); http.expectOne(recibos).flush([]); http.expectNone(r => r.method === 'DELETE');
    c.excluir(); c.excluir(); http.expectOne(`${base}/contapagar/deletar-contapagar/123`).flush({ detail: 'Pagamento concorrente' }, { status: 409, statusText: 'Conflict' }); http.expectOne(lista).flush([contaFixture()]); expect(c.prontoExcluir()).toBeNull(); expect(c.erro()).toContain('Pagamento concorrente');
  });
  it('troca de administrador impede confirmar intenção em memória', () => {
    iniciar(); abrir(); usuario.set({ id: 2, tipoPessoa: 'ADMIN' }); c.confirmarPagamento(); http.expectNone(buscar); http.expectNone(r => r.method === 'POST');
  });
  it('pagamento posterior usa o novo saldo e uma nova intenção após sucesso concluído', () => {
    iniciar(); abrir(); const primeiro = confirmar(); const chave = primeiro.request.headers.get('Idempotency-Key'); primeiro.flush({ id: 13 }); concluirAtualizacao();
    const atual = c.contas()[0]; c.abrirModalPagamento(atual); http.expectOne(buscar).flush(atual); expect(c.pagamentoForm.controls.valor.value).toBe(1800);
    c.confirmarPagamento(); http.expectOne(buscar).flush(atual); const segundo = http.expectOne(r => r.method === 'POST'); expect(segundo.request.headers.get('Idempotency-Key')).not.toBe(chave); expect(segundo.request.params.get('valorPago')).toBe('1800'); segundo.flush({}, { status: 400, statusText: 'Bad Request' });
  });
  it('pagamento já registrado não pode ser descartado pelo fluxo de intenção incerta', () => {
    storage.salvar({ ...intencao, estado: 'REGISTRADA' }); iniciar(); c.conferencia.setValue(true); c.conferida.set(true); c.encerrarPendencia(); c.conferir();
    expect(c.pendente()?.estado).toBe('REGISTRADA'); http.expectNone(buscar); http.expectNone(recibos); http.expectNone(r => r.method === 'POST');
  });
});
