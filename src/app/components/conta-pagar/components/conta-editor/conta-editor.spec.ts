import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ContaEditor } from './conta-editor';
import { environment } from '../../../../../environments/environment';
import { contaFixture, reciboFixture } from '../../../relatorios/testing/relatorios.fixtures';
describe('ContaEditor', () => {
  let fixture: ComponentFixture<ContaEditor>; let c: ContaEditor; let http: HttpTestingController; const base = environment.apiUrl;
  beforeEach(() => { TestBed.configureTestingModule({ imports: [ContaEditor], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()] }); http = TestBed.inject(HttpTestingController); });
  afterEach(() => { fixture?.destroy(); http.verify({ ignoreCancelled: true }); });
  function iniciar(id: number | null = null): void {
    fixture = TestBed.createComponent(ContaEditor); fixture.componentRef.setInput('contaId', id); c = fixture.componentInstance; fixture.detectChanges();
    http.expectOne(`${base}/aluno/listar?situacao=NAO_ARQUIVADOS`).flush([{ id: 7, nome: 'João', arquivado: false }, { id: 8, nome: 'Arquivado', arquivado: true }]);
    http.expectOne(`${base}/motorista/listar`).flush([{ id: 42, nome: 'José' }]);
    http.expectOne(`${base}/usuarios`).flush([{ id: 99, pessoaId: 1, nome: 'Admin', tipoPessoa: 'ADMIN' }, { id: 100, pessoaId: 7, nome: 'João', tipoPessoa: 'ALUNO' }]);
  }
  function dados(): void { c.form.setValue({ descricao: 'Despesa teste', valor: 100, dataVencimento: '2026-10-31', competencia: '2026-10', classificacao: 'DESPESA', beneficiarioId: null }); }
  it('cria despesa sem pessoa e envia competência explicitamente, sem status', () => {
    iniciar(); dados(); c.salvar(); c.salvar(); const r = http.expectOne(`${base}/contapagar/salvar-contapagar`); expect(r.request.body).toEqual({ descricao: 'Despesa teste', valor: 100, dataVencimento: '2026-10-31', competencia: '2026-10', classificacao: 'DESPESA', motorista: null }); r.flush(contaFixture());
  });
  it('despesas admitem aluno e ADMIN por pessoaId; arquivado não recebe novo vínculo', () => {
    iniciar(); dados(); expect(c.beneficiarios().map(p => p.id).sort((a,b) => a-b)).toEqual([1, 7, 42]);
    c.form.controls.beneficiarioId.setValue(1); c.salvar(); const r = http.expectOne(`${base}/contapagar/salvar-contapagar`); expect(r.request.body.motorista).toEqual({ id: 1 }); r.flush(contaFixture());
  });
  it('salário exige motorista, não aceita beneficiário genérico e não muda status', () => {
    iniciar(); dados(); c.form.patchValue({ classificacao: 'SALARIO', beneficiarioId: 7 }); c.salvar(); expect(c.erro()).toContain('motorista'); http.expectNone(r => r.method === 'POST');
    c.form.controls.beneficiarioId.setValue(42); c.salvar(); const r = http.expectOne(`${base}/contapagar/salvar-contapagar`); expect(r.request.body.classificacao).toBe('SALARIO'); expect(r.request.body.status).toBeUndefined(); r.flush(contaFixture());
  });
  it('salário duplicado em criação mantém formulário para revisão, sem repetição', () => {
    iniciar(); dados(); c.form.patchValue({ classificacao: 'SALARIO', beneficiarioId: 42 }); c.salvar(); http.expectOne(`${base}/contapagar/salvar-contapagar`).flush({ detail: 'Já existe salário para motorista e competência.' }, { status: 409, statusText: 'Conflict' });
    expect(c.erro()).toContain('Já existe salário'); expect(c.form.controls.beneficiarioId.value).toBe(42); expect(c.salvando()).toBeFalse(); http.expectNone(r => r.method === 'POST');
  });
  for (const valor of [0, -10, 600]) {
    it(`qualquer comprovante (${valor}) protege valor e pessoa durante edição`, () => {
      iniciar(123); const conta = { ...contaFixture(), valorPago: valor }; http.expectOne(`${base}/contapagar/buscar-contapagar/123`).flush(conta); http.expectOne(`${base}/pagamentos/conta/123`).flush([{ ...reciboFixture, valor }]);
      expect(c.protegido()).toBeTrue(); expect(c.form.controls.valor.disabled).toBeTrue(); expect(c.form.controls.beneficiarioId.disabled).toBeTrue();
      c.form.controls.valor.setValue(99); c.form.controls.beneficiarioId.setValue(1); c.form.controls.classificacao.setValue('DESPESA'); c.form.controls.descricao.setValue('Descrição corrigida'); c.salvar();
      const r = http.expectOne(`${base}/contapagar/atualizar-contapagar/123`); expect(r.request.body.valor).toBe(3000); expect(r.request.body.motorista).toEqual({ id: 42 }); expect(r.request.body.descricao).toBe('Descrição corrigida'); r.flush(conta);
    });
  }
  it('quitação histórica sem comprovantes também protege os campos', () => {
    iniciar(123); http.expectOne(`${base}/contapagar/buscar-contapagar/123`).flush({ ...contaFixture(), status: 'PAGO', valorPago: 0, saldoRestante: 0, avisos: ['QUITACAO_SEM_COMPROVANTE'] }); http.expectOne(`${base}/pagamentos/conta/123`).flush([]); expect(c.protegido()).toBeTrue();
  });
  it('preserva beneficiário genérico antigo que não aparece mais nos cadastros', () => {
    iniciar(123); const conta = { ...contaFixture(), classificacao: 'DESPESA', motorista: { id: 333, nome: 'Pessoa antiga', tipoPessoa: 'ALUNO' } }; http.expectOne(`${base}/contapagar/buscar-contapagar/123`).flush(conta); http.expectOne(`${base}/pagamentos/conta/123`).flush([reciboFixture]);
    expect(c.beneficiarios().some(p => p.id === 333)).toBeTrue(); c.salvar(); const r = http.expectOne(`${base}/contapagar/atualizar-contapagar/123`); expect(r.request.body.motorista).toEqual({ id: 333 }); r.flush(conta);
  });
  it('conflito na edição recarrega conta e comprovantes sem reenviar PUT', () => {
    iniciar(123); http.expectOne(`${base}/contapagar/buscar-contapagar/123`).flush(contaFixture()); http.expectOne(`${base}/pagamentos/conta/123`).flush([reciboFixture]); c.salvar(); http.expectOne(`${base}/contapagar/atualizar-contapagar/123`).flush({}, { status: 409, statusText: 'Conflict' });
    http.expectOne(`${base}/contapagar/buscar-contapagar/123`).flush({ ...contaFixture(), descricao: 'Atualizada por outro admin' }); http.expectOne(`${base}/pagamentos/conta/123`).flush([reciboFixture]); expect(c.aviso()).toContain('Revise'); expect(c.form.controls.descricao.value).toContain('outro admin'); http.expectNone(r => r.method === 'PUT');
  });
});
