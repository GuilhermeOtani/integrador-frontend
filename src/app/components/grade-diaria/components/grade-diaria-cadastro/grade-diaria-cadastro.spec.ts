import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';

import { GradeDiariaCadastro } from './grade-diaria-cadastro';

describe('GradeDiariaCadastro', () => {
  let component: GradeDiariaCadastro;
  let fixture: ComponentFixture<GradeDiariaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDiariaCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeDiariaCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function carregarListas() {
    const http = TestBed.inject(HttpTestingController);
    const base = environment.apiUrl;
    http.expectOne(`${base}/rota/listar`).flush([{ id: 1, nome: 'Rota' }]);
    http.expectOne(`${base}/onibus/listar`).flush([
      { id: 3, numeroIdentificacao: 'Operando', statusOnibus: 'OPERANDO' },
      { id: 4, numeroIdentificacao: 'Quebrado', statusOnibus: 'QUEBRADO' },
      { id: 5, numeroIdentificacao: 'Antigo', statusOnibus: null },
    ]);
    http.expectOne(`${base}/motorista/listar`).flush([{ id: 2, nome: 'Motorista' }]);
    http.expectOne(`${base}/faculdade/listar`).flush([{ id: 6, nome: 'Faculdade' }]);
    return http;
  }
  it('mantém lista completa, mas oferece somente OPERANDO para novas viagens', () => {
    carregarListas();
    expect(component.listaOnibus.length).toBe(3);
    expect(component.onibusDisponiveis.map(o => o.id)).toEqual([3]);
    component.novaViagem = { rotaId: 1, onibusId: 4, motoristaId: 2, faculdadesIds: [6] };
    component.adicionarViagem(); expect(component.grade.viagens).toEqual([]);
    component.novaViagem.onibusId = 3; component.adicionarViagem();
    expect(component.grade.viagens[0].onibusId).toBe(3);
    expect(component.grade.viagens[0].faculdades).toEqual([{ id: 6, nome: 'Faculdade' }]);
    expect(component.grade.viagens[0].id).toBeUndefined();
  });
  it('avisa sobre ônibus indisponível/sem estado sem remover viagem existente', () => {
    carregarListas();
    const viagem = { id: 40, onibusId: 4, faculdades: [{ id: 6, nome: 'Faculdade' }] };
    component.grade.viagens = [viagem];
    expect(component.avisoOnibus(viagem)).toContain('Quebrado');
    expect(component.avisoOnibus({ onibusId: 5 })).toContain('Não informado');
    expect(component.avisoOnibus({ onibusId: 3 })).toBe('');
    expect(component.grade.viagens).toEqual([viagem]);
  });
  it('preserva IDs, ônibus e faculdades no PUT da grade existente', () => {
    const http = carregarListas();
    component.grade = { id: 10, diaSemana: 'SEGUNDA', descricao: 'Alterada', viagens: [
      { id: 40, onibusId: 4, rotaId: 1, motoristaId: 2, faculdades: [{ id: 6, nome: 'Faculdade' }] },
    ] };
    const emit = spyOn(component.aoSalvar, 'emit');
    component.confirmarSalvar(); component.confirmarSalvar();
    const req = http.expectOne(`${environment.apiUrl}/grade-diaria/atualizar-grade/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.viagens).toEqual(component.grade.viagens);
    expect(req.request.body.viagens[0].id).toBe(40);
    expect(req.request.body.viagens[0].faculdadesIds).toBeUndefined();
    req.flush({}); expect(emit).toHaveBeenCalledTimes(1); http.verify();
  });
  it('409 mantém o formulário e viagens, recarregando a disponibilidade', () => {
    const http = carregarListas();
    component.grade = { id: 10, diaSemana: 'SEGUNDA', viagens: [{ id: 40, onibusId: 4, faculdades: [] }] };
    const emit = spyOn(component.aoSalvar, 'emit');
    component.confirmarSalvar();
    http.expectOne(`${environment.apiUrl}/grade-diaria/atualizar-grade/10`).flush({ detail: 'Ônibus não está operando' }, { status: 409, statusText: 'Conflict' });
    expect(emit).not.toHaveBeenCalled();
    expect(component.grade.viagens[0].id).toBe(40);
    expect(component.erroSalvar).toContain('Ônibus não está operando');
    expect(component.salvando).toBeFalse();
    http.expectOne(`${environment.apiUrl}/onibus/listar`).flush([{ id: 4, statusOnibus: 'MANUTENCAO' }]);
    expect(component.listaOnibus[0].statusOnibus).toBe('MANUTENCAO'); http.verify();
  });
});
