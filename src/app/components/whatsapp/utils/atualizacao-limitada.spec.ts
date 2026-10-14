import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AtualizacaoLimitada } from './atualizacao-limitada';

describe('AtualizacaoLimitada', () => {
  it('consulta a cada cinco segundos e termina após dez minutos', fakeAsync(() => { const p = new AtualizacaoLimitada(); const get = jasmine.createSpy().and.returnValue(of(1)); p.iniciar(get, () => {}, () => {}, () => true); tick(600_000); const vezes = get.calls.count(); expect(vezes).toBeGreaterThan(0); expect(vezes).toBeLessThanOrEqual(120); tick(5000); expect(get.calls.count()).toBe(vezes); p.parar(); }));
  it('para ao confirmar, no erro e ao sair', fakeAsync(() => { const p = new AtualizacaoLimitada(); const get = jasmine.createSpy().and.returnValue(of('ATIVA')); p.iniciar(get, () => {}, () => {}, () => false); tick(15000); expect(get).toHaveBeenCalledTimes(1); const erro = jasmine.createSpy(); get.and.returnValue(throwError(() => new Error('falha'))); p.iniciar(get, () => {}, erro, () => true); tick(10000); expect(erro).toHaveBeenCalledTimes(1); p.iniciar(get, () => {}, erro, () => true); p.parar(); tick(5000); expect(get).toHaveBeenCalledTimes(2); }));
  it('respeita expiração e cancela GET em andamento', fakeAsync(() => { const p = new AtualizacaoLimitada(); const cancelar = jasmine.createSpy(); const get = jasmine.createSpy().and.returnValue(new Observable(() => cancelar)); p.iniciar(get, () => {}, () => {}, () => true, new Date(Date.now() + 7000).toISOString()); tick(5000); expect(get).toHaveBeenCalledTimes(1); tick(2000); expect(cancelar).toHaveBeenCalled(); p.iniciar(get, () => {}, () => {}, () => true, new Date(Date.now() - 1).toISOString()); tick(5000); expect(get).toHaveBeenCalledTimes(1); }));
});
