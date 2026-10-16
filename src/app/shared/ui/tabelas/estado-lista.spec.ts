import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { EstadoLista } from './estado-lista';
@Component({ standalone: true, template: '' })
class ListaTeste { readonly estado = new EstadoLista(); }
describe('Estado visual das listagens', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ListaTeste] }));
  it('apenas acompanha o GET existente, sem alterar os dados ou repetir a consulta', () => {
    const fixture = TestBed.createComponent(ListaTeste), estado = fixture.componentInstance.estado;
    const consulta = new Subject<number[]>(), recebido = jasmine.createSpy();
    estado.acompanhar(consulta).subscribe(recebido); expect(estado.carregando()).toBeTrue();
    consulta.next([2, 1]); consulta.complete(); expect(recebido).toHaveBeenCalledOnceWith([2, 1]); expect(estado.carregando()).toBeFalse();
  });
  it('falha não vira sucesso vazio; mantém o tratamento de erro do chamador', () => {
    const fixture = TestBed.createComponent(ListaTeste), estado = fixture.componentInstance.estado, consulta = new Subject<unknown>();
    const falhou = jasmine.createSpy(); estado.acompanhar(consulta).subscribe({ error: falhou });
    consulta.error(new HttpErrorResponse({ status: 500, error: { detail: 'Falha segura de consulta.' } }));
    expect(estado.erro()).toBe('Falha segura de consulta.'); expect(estado.carregando()).toBeFalse(); expect(falhou).toHaveBeenCalledTimes(1);
  });
  it('consultas simultâneas mantêm carregamento até a última terminar', () => {
    const fixture = TestBed.createComponent(ListaTeste), estado = fixture.componentInstance.estado;
    const a = new Subject<unknown>(), b = new Subject<unknown>(); estado.acompanhar(a).subscribe(); estado.acompanhar(b).subscribe();
    a.complete(); expect(estado.carregando()).toBeTrue(); b.complete(); expect(estado.carregando()).toBeFalse();
  });
  it('destruir a tela cancela apenas a assinatura da consulta', () => {
    const fixture = TestBed.createComponent(ListaTeste), estado = fixture.componentInstance.estado, consulta = new Subject<unknown>();
    const sub = estado.acompanhar(consulta).subscribe(); fixture.destroy(); expect(sub.closed).toBeTrue(); expect(estado.carregando()).toBeFalse();
  });
});
