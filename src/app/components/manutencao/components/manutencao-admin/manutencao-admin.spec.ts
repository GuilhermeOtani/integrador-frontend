import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ManutencaoService } from '../../service/manutencao.service';
import { ChamadoManutencao } from '../../models/manutencao.models';
import { ManutencaoAdmin } from './manutencao-admin';
import { CHAMADO_TESTE, ONIBUS_TESTE } from '../../testing/manutencao.fixtures';

describe('ManutencaoAdmin', () => {
  let component: ManutencaoAdmin;
  let fixture: ComponentFixture<ManutencaoAdmin>;
  let api: jasmine.SpyObj<ManutencaoService>;
  let messages: jasmine.SpyObj<MessageService>;
  let params: BehaviorSubject<ParamMap>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('ManutencaoService', ['listar', 'listarOnibus', 'buscar', 'atender']);
    messages = jasmine.createSpyObj('MessageService', ['add']);
    api.listar.and.returnValue(of([CHAMADO_TESTE]));
    api.listarOnibus.and.returnValue(of([ONIBUS_TESTE]));
    api.buscar.and.returnValue(of(CHAMADO_TESTE));
    api.atender.and.returnValue(of(CHAMADO_TESTE));
    params = new BehaviorSubject(convertToParamMap({ onibusId: '3' }));
    await TestBed.configureTestingModule({ imports: [ManutencaoAdmin], providers: [
      provideRouter([]), provideNoopAnimations(),
      { provide: ActivatedRoute, useValue: { queryParamMap: params } },
      { provide: ManutencaoService, useValue: api }, { provide: MessageService, useValue: messages },
    ] }).compileComponents();
    fixture = TestBed.createComponent(ManutencaoAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('aplica o atalho antes da primeira consulta e mostra autoria', () => {
    expect(api.listar).toHaveBeenCalledOnceWith({ onibusId: 3 });
    expect(component.filtros.controls.onibusId.value).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Aluno Teste');
    expect(fixture.nativeElement.textContent).toContain('Aluno');
  });
  it('ignora parâmetro inválido e consulta sem ônibus', () => {
    params.next(convertToParamMap({ onibusId: '2.5' }));
    expect(api.listar.calls.mostRecent().args).toEqual([{}]);
    expect(component.filtros.controls.onibusId.value).toBeNull();
  });
  it('aplica filtros independentes, atualiza os aplicados e limpa URL', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.filtros.patchValue({ status: 'ABERTO', urgencia: 'ALTA' });
    component.aplicar();
    expect(api.listar.calls.mostRecent().args).toEqual([{ status: 'ABERTO', urgencia: 'ALTA', onibusId: 3 }]);
    component.filtros.controls.urgencia.setValue('BAIXA');
    component.carregar();
    expect(api.listar.calls.mostRecent().args[0]?.urgencia).toBe('ALTA');
    component.limpar();
    expect(api.listar.calls.mostRecent().args).toEqual([{}]);
    expect(navigate.calls.mostRecent().args[1]?.queryParams).toEqual({ onibusId: null });
  });
  it('busca dados atuais antes de atender e preserva resposta', () => {
    component.atender(4);
    expect(api.buscar).toHaveBeenCalledOnceWith(4);
    expect(component.form.controls.observacaoAdmin.value).toBe('Resposta anterior');
    expect(component.form.controls.alterarOnibus.value).toBeFalse();
    expect(component.form.controls.statusOnibus.disabled).toBeTrue();
  });
  it('exige justificativa não vazia ao resolver', () => {
    component.atender(4);
    component.form.patchValue({ status: 'RESOLVIDO', observacaoAdmin: ' \n ' });
    component.salvar();
    expect(component.form.controls.observacaoAdmin.hasError('required')).toBeTrue();
    expect(api.atender).not.toHaveBeenCalled();
    component.form.controls.observacaoAdmin.setValue('a'.repeat(2001));
    expect(component.form.invalid).toBeTrue();
  });
  it('resolve sem alterar o ônibus e atualiza lista e opções', () => {
    component.atender(4);
    component.form.patchValue({ status: 'RESOLVIDO', observacaoAdmin: '  Consertado  ' });
    component.salvar();
    expect(api.atender).toHaveBeenCalledOnceWith(4, { status: 'RESOLVIDO', urgencia: 'MEDIA', observacaoAdmin: 'Consertado' });
    expect(component.dialogoAberto).toBeFalse();
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(api.listarOnibus).toHaveBeenCalledTimes(2);
  });
  it('envia estado do ônibus somente com checkbox marcado', () => {
    component.atender(4);
    component.form.patchValue({ alterarOnibus: true, statusOnibus: null });
    component.salvar(); expect(api.atender).not.toHaveBeenCalled();
    component.form.controls.statusOnibus.setValue('MANUTENCAO');
    component.salvar();
    expect(api.atender.calls.mostRecent().args[1]).toEqual({ status: 'ABERTO', urgencia: 'MEDIA', observacaoAdmin: 'Resposta anterior', statusOnibus: 'MANUTENCAO' });
  });
  it('desmarcar checkbox omite estado, mesmo que tenha valor selecionado', () => {
    component.atender(4);
    component.form.patchValue({ alterarOnibus: true, statusOnibus: 'OPERANDO' });
    component.form.controls.alterarOnibus.setValue(false);
    component.salvar();
    expect(api.atender.calls.mostRecent().args[1].statusOnibus).toBeUndefined();
  });
  it('reabre com resposta preservada e permite limpar observação enviando null', () => {
    api.buscar.and.returnValue(of({ ...CHAMADO_TESTE, status: 'RESOLVIDO' }));
    component.atender(4);
    component.form.controls.status.setValue('EM_ANDAMENTO'); component.salvar();
    expect(api.atender.calls.mostRecent().args[1].observacaoAdmin).toBe('Resposta anterior');
    component.atender(4);
    component.form.patchValue({ status: 'ABERTO', observacaoAdmin: '' }); component.salvar();
    expect(api.atender.calls.mostRecent().args[1].observacaoAdmin).toBeNull();
  });
  it('bloqueia atendimento duplicado', () => {
    const resposta = new Subject<ChamadoManutencao>();
    api.atender.and.returnValue(resposta);
    component.atender(4); component.salvar(); component.salvar();
    expect(api.atender).toHaveBeenCalledTimes(1);
    expect(component.salvando()).toBeTrue();
    resposta.complete(); expect(component.salvando()).toBeFalse();
  });
  for (const status of [0, 400, 409]) {
    it(`mantém formulário e resposta em ${status}`, () => {
      api.atender.and.returnValue(throwError(() => new HttpErrorResponse({ status, error: {
        detail: 'Revise a resposta', errors: { observacaoAdmin: 'Resposta inválida' },
      } })));
      component.atender(4); component.salvar();
      expect(component.dialogoAberto).toBeTrue();
      expect(component.form.controls.observacaoAdmin.value).toBe('Resposta anterior');
      expect(component.erroForm()).toBeTruthy();
      expect(messages.add).not.toHaveBeenCalled();
      if (status === 400) expect(component.form.controls.observacaoAdmin.getError('servidor')).toBe('Resposta inválida');
    });
  }
  it('404 fecha atendimento e recarrega as listas', () => {
    api.atender.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.atender(4); component.salvar();
    expect(component.dialogoAberto).toBeFalse();
    expect(component.selecionado()).toBeNull();
    expect(api.listar).toHaveBeenCalledTimes(2);
    expect(api.listarOnibus).toHaveBeenCalledTimes(2);
  });
  it('não exibe detalhes em 404 nem duplica notificações do interceptor', () => {
    for (const status of [0, 401, 403, 404]) {
      api.buscar.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      component.atender(4);
      expect(component.dialogoAberto).toBeFalse();
      expect(component.selecionado()).toBeNull();
    }
    expect(messages.add).toHaveBeenCalledTimes(1);
  });
  it('descarta consulta antiga ao mudar filtros', () => {
    const antiga = new Subject<ChamadoManutencao[]>();
    api.listar.and.returnValue(antiga);
    component.carregar();
    expect(component.carregando()).toBeTrue();
    api.listar.and.returnValue(of([]));
    component.aplicar(); antiga.next([CHAMADO_TESTE]);
    expect(component.chamados()).toEqual([]);
    expect(component.carregando()).toBeFalse();
  });

  it('distingue lista vazia e erro sem confundir com carregamento', () => {
    api.listar.and.returnValue(of([])); component.carregar(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado encontrado');
    expect(component.erroLista()).toBe('');
    api.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.carregar(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Falha na consulta');
    expect(component.erroLista()).toBeTruthy();
    expect(component.carregando()).toBeFalse();
  });
});
