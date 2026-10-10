import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ManutencaoService } from '../../service/manutencao.service';
import { ChamadoManutencao } from '../../models/manutencao.models';
import { MeusChamados } from './meus-chamados';
import { CHAMADO_TESTE, ONIBUS_TESTE } from '../../testing/manutencao.fixtures';

describe('MeusChamados', () => {
  let component: MeusChamados;
  let fixture: ComponentFixture<MeusChamados>;
  let api: jasmine.SpyObj<ManutencaoService>;
  let messages: jasmine.SpyObj<MessageService>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('ManutencaoService', ['minhas', 'listarOnibus', 'buscar', 'abrir']);
    messages = jasmine.createSpyObj('MessageService', ['add']);
    api.minhas.and.returnValue(of([CHAMADO_TESTE]));
    api.listarOnibus.and.returnValue(of([ONIBUS_TESTE]));
    api.buscar.and.returnValue(of(CHAMADO_TESTE));
    api.abrir.and.returnValue(of(CHAMADO_TESTE));
    await TestBed.configureTestingModule({ imports: [MeusChamados], providers: [provideNoopAnimations(),
      { provide: ManutencaoService, useValue: api }, { provide: MessageService, useValue: messages },
    ] }).compileComponents();
    fixture = TestBed.createComponent(MeusChamados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  function preencher() {
    component.abrirFormulario();
    component.form.setValue({ onibusId: 3, descricao: '  Ar quebrado  ' });
  }
  it('lista próprios chamados e permite selecionar ônibus indisponível', () => {
    expect(api.minhas).toHaveBeenCalledTimes(1);
    expect(component.opcoesOnibus()[0].id).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('08/10/2026');
  });
  it('valida descrição vazia, espaços e limite de 2000', () => {
    preencher();
    for (const texto of ['', ' \n ', 'a'.repeat(2001)]) {
      component.form.controls.descricao.setValue(texto);
      component.enviar();
    }
    expect(api.abrir).not.toHaveBeenCalled();
    component.form.controls.descricao.setValue('a'.repeat(2000));
    expect(component.form.valid).toBeTrue();
  });
  it('envia sem autoria, limpa o formulário e atualiza a lista', () => {
    preencher(); component.enviar();
    expect(api.abrir).toHaveBeenCalledOnceWith({ onibusId: 3, descricao: 'Ar quebrado' });
    expect(component.novoAberto).toBeFalse();
    expect(component.form.controls.descricao.value).toBe('');
    expect(api.minhas).toHaveBeenCalledTimes(2);
  });
  it('bloqueia envio duplicado enquanto aguarda', () => {
    const resposta = new Subject<ChamadoManutencao>();
    api.abrir.and.returnValue(resposta);
    preencher(); component.enviar(); component.enviar();
    expect(api.abrir).toHaveBeenCalledTimes(1);
    expect(component.salvando()).toBeTrue();
    resposta.next(CHAMADO_TESTE); resposta.complete();
    expect(component.salvando()).toBeFalse();
  });
  it('associa erros 400 e preserva texto e ônibus', () => {
    api.abrir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { descricao: 'Descrição inválida' } } })));
    preencher(); component.enviar();
    expect(component.form.controls.descricao.getError('servidor')).toBe('Descrição inválida');
    expect(component.form.controls.descricao.value).toBe('  Ar quebrado  ');
    expect(component.form.controls.onibusId.value).toBe(3);
    expect(component.novoAberto).toBeTrue();
  });
  for (const status of [0, 409]) {
    it(`preserva relato em ${status}, sem repetir POST nem toast global`, () => {
      api.abrir.and.returnValue(throwError(() => new HttpErrorResponse({ status, error: { detail: 'Conflito' } })));
      preencher(); component.enviar();
      expect(component.novoAberto).toBeTrue();
      expect(component.form.controls.descricao.value).toBe('  Ar quebrado  ');
      expect(api.abrir).toHaveBeenCalledTimes(1);
      expect(messages.add).not.toHaveBeenCalled();
      expect(component.erroForm()).toBeTruthy();
    });
  }
  it('404 na abertura preserva relato e atualiza opções', () => {
    api.abrir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    preencher(); const antes = api.listarOnibus.calls.count(); component.enviar();
    expect(api.listarOnibus.calls.count()).toBe(antes + 1);
    expect(component.novoAberto).toBeTrue();
    expect(component.form.controls.onibusId.value).toBe(3);
  });
  it('consulta detalhe atualizado e fecha sem exibir recurso em 404', () => {
    component.ver(4);
    expect(api.buscar).toHaveBeenCalledWith(4);
    expect(component.detalhe()).toEqual(CHAMADO_TESTE);
    api.buscar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.ver(9);
    expect(component.detalhesAberto).toBeFalse();
    expect(component.detalhe()).toBeNull();
  });
  it('distingue lista carregando, vazia e erro', () => {
    const resposta = new Subject<ChamadoManutencao[]>();
    api.minhas.and.returnValue(resposta);
    component.carregar(); expect(component.carregando()).toBeTrue();
    resposta.next([]); resposta.complete(); fixture.detectChanges();
    expect(component.carregando()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Você ainda não abriu chamados');
    api.minhas.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.carregar(); fixture.detectChanges();
    expect(component.erroLista()).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar');
  });
});
