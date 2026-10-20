import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '../../../../../environments/environment';
import rota from '../../models/rota';
import { RotaCadastro } from './rota-cadastro';

describe('RotaCadastro', () => {
  let component: RotaCadastro;
  let fixture: ComponentFixture<RotaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RotaCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const pontos=[{id:1,descricao:'Praça',ordemParada:1},{id:2,descricao:'Mercado',ordemParada:2}];
  function abrir(valor:Partial<rota>) {
    fixture.componentRef.setInput('rota',valor);fixture.detectChanges();
    const http=TestBed.inject(HttpTestingController);
    http.expectOne(environment.apiUrl+'/ponto-embarque/listar').flush(pontos);fixture.detectChanges();
    http.expectNone(r=>r.url.includes('/faculdade/')||r.url.includes('/aluno/'));
    return http;
  }
  it('remove somente a interface da faculdade, preservando vínculo no PUT',()=>{
    const faculdade={id:8,nome:'Unidade antiga'};
    const http=abrir({id:10,nome:'Rota',descricao:'Centro',faculdade:faculdade as any,faculdadeId:8,pontosEmbarque:[pontos[1]]});
    expect(fixture.nativeElement.textContent).not.toContain('Faculdade Destino');
    expect(fixture.nativeElement.querySelector('p-select')).toBeNull();
    component.rota.nome='Rota alterada';component.confirmarSalvar();
    const req=http.expectOne(environment.apiUrl+'/rota/10');
    expect(req.request.method).toBe('PUT');expect(req.request.body.faculdade).toEqual(faculdade);
    expect(req.request.body.faculdadeId).toBe(8);expect(req.request.body.pontosEmbarque).toEqual([pontos[1]]);
    req.flush({});http.verify();
  });
  it('mantém transferência e reordenação nas duas listas com payload ordenado',()=>{
    const http=abrir({nome:'Nova rota',descricao:'',pontosEmbarque:[pontos[1]]});
    fixture.nativeElement.querySelector('.p-picklist-source-list-container [role="option"]').click();fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Adicionar pontos à rota"]').click();fixture.detectChanges();
    expect(component.pontosSelecionados.map(p=>p.id)).toEqual([2,1]);
    const destino=fixture.nativeElement.querySelectorAll('.p-picklist-target-list-container [role="option"]');
    destino[1].click();fixture.detectChanges();
    fixture.nativeElement.querySelector('.p-picklist-target-controls button[aria-label="Mover ponto para cima"]').click();fixture.detectChanges();
    expect(component.pontosSelecionados.map(p=>p.id)).toEqual([1,2]);
    component.confirmarSalvar();const req=http.expectOne(environment.apiUrl+'/rota/salvar-rota');
    expect(req.request.body.pontosEmbarque.map((p:{id:number})=>p.id)).toEqual([1,2]);
    expect(req.request.body.faculdade).toBeUndefined();req.flush({});http.verify();
  });
  it('erro HTTP mantém nome e seleção local; cancelar não executa exclusão',()=>{
    const http=abrir({nome:'Rascunho',descricao:'Centro',pontosEmbarque:[pontos[0]]});
    component.confirmarSalvar();
    http.expectOne(environment.apiUrl+'/rota/salvar-rota').flush({detail:'Conflito'},{status:409,statusText:'Conflict'});
    expect(component.rota.nome).toBe('Rascunho');expect(component.pontosSelecionados).toEqual([pontos[0]]);
    const cancelar=spyOn(component.aoCancelar,'emit');component.cancelar();
    expect(cancelar).toHaveBeenCalledTimes(1);http.expectNone(r=>r.method==='DELETE');http.verify();
  });
});
