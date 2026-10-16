import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AlunoService } from '../../../aluno/service/aluno-service';
import Aluno from '../../../aluno/models/aluno';
import { ContaReceberService } from '../../service/conta-receber-service';
import { ContaReceber } from '../../models/conta-receber';
import { cobrancaFixture } from '../../testing/receber.fixtures';
import { CobrancaEditor } from './cobranca-editor';
describe('CobrancaEditor administrativo', () => {
  let fixture: ComponentFixture<CobrancaEditor>, c: CobrancaEditor, api: jasmine.SpyObj<ContaReceberService>, alunos: jasmine.SpyObj<AlunoService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('ContaReceberService', ['buscar', 'criar', 'atualizar']); alunos = jasmine.createSpyObj('AlunoService', ['listarAlunos']);
    alunos.listarAlunos.and.returnValue(of([{ id: 10, nome: 'Ana', arquivado: false }, { id: 11, nome: 'Arquivado', arquivado: true }] as Aluno[]));
    TestBed.configureTestingModule({ imports: [CobrancaEditor], providers: [provideNoopAnimations(), { provide: ContaReceberService, useValue: api }, { provide: AlunoService, useValue: alunos }] });
  });
  function criar(id: number | null = null) { fixture = TestBed.createComponent(CobrancaEditor); fixture.componentRef.setInput('contaId', id); c = fixture.componentInstance; fixture.detectChanges(); }
  function preencher() { c.form.setValue({ descricao: 'Mensalidade de outubro', valor: 300, dataVencimento: '2026-11-05', competencia: '2026-10', alunoId: 10 }); }
  it('cria cobrança com competência explícita, aluno não arquivado e sem campos contábeis/status', () => {
    criar(); preencher(); api.criar.and.returnValue(of(cobrancaFixture())); c.salvar();
    expect(alunos.listarAlunos).toHaveBeenCalledWith('NAO_ARQUIVADOS'); expect(c.alunos().map(a => a.id)).toEqual([10]);
    expect(api.criar).toHaveBeenCalledOnceWith({ descricao: 'Mensalidade de outubro', valor: 300, dataVencimento: '2026-11-05', competencia: '2026-10', aluno: { id: 10 } });
  });
  for (const alteracao of [{ valor: 0 }, { valor: -1 }, { valor: 1.001 }, { dataVencimento: '2026-02-30' }, { competencia: '2026-10-01' }, { competencia: '' }, { alunoId: 11 }, { alunoId: -1 }, { descricao: ' ' }]) {
    it(`valida formulário ${JSON.stringify(alteracao)}`, () => { criar(); preencher(); c.form.patchValue(alteracao); c.salvar(); expect(api.criar).not.toHaveBeenCalled(); expect(c.erro()).not.toBe(''); });
  }
  it('edita descrição/competência/vencimento preservando valor/aluno de conta parcialmente recebida', () => {
    api.buscar.and.returnValue(of(cobrancaFixture())); criar(42); expect(c.protegido()).toBeTrue(); expect(c.form.controls.valor.disabled).toBeTrue();
    c.form.patchValue({ valor: 1, alunoId: 11, descricao: 'Correção', competencia: '2026-11' });
    // Mesmo se controles forem adulterados, o payload protegido usa o snapshot original.
    c.form.controls.alunoId.setValue(10); api.atualizar.and.returnValue(of(cobrancaFixture())); c.salvar();
    expect(api.atualizar).toHaveBeenCalledOnceWith(42, jasmine.objectContaining({ valor: 300, aluno: { id: 10 }, descricao: 'Correção', competencia: '2026-11' }));
  });
  it('mantém aluno histórico fora da lista e quitação sem comprovante protegida', () => {
    api.buscar.and.returnValue(of(cobrancaFixture({ alunoId: 99, nomeAluno: 'Histórico', status: 'PAGO', valorRecebido: 0, saldoRestante: 0, recebimentoParcial: false, avisos: ['QUITACAO_SEM_COMPROVANTE'] })));
    criar(42); expect(c.alunos().some(a => a.id === 99)).toBeTrue(); expect(c.form.controls.alunoId.disabled).toBeTrue();
  });
  it('409 recarrega posição protegida e exige revisão, sem repetir PUT', () => {
    api.buscar.and.returnValue(of(cobrancaFixture({ valorRecebido: 0, recebimentoParcial: false }))); criar(42);
    api.atualizar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Competência duplicada.' } })));
    api.buscar.and.returnValue(of(cobrancaFixture())); c.salvar(); expect(api.atualizar).toHaveBeenCalledTimes(1); expect(api.buscar).toHaveBeenCalledTimes(2);
    expect(c.aviso()).toContain('Revise'); expect(c.protegido()).toBeTrue();
  });
  it('bloqueia duplo envio e fechamento durante gravação', () => {
    criar(); preencher(); const resposta = new Subject<ContaReceber>(); api.criar.and.returnValue(resposta); const fechado = jasmine.createSpy(); c.fechado.subscribe(fechado);
    c.salvar(); c.salvar(); c.fechar(); expect(api.criar).toHaveBeenCalledTimes(1); expect(fechado).not.toHaveBeenCalled(); resposta.complete();
  });
  it('erro ao carregar não vira formulário de edição pronto', () => {
    api.buscar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Cobrança não encontrada.' } })));
    criar(42); expect(c.pronto()).toBeFalse(); c.salvar(); expect(api.atualizar).not.toHaveBeenCalled(); expect(c.erro()).toBe('Cobrança não encontrada.');
  });
});
