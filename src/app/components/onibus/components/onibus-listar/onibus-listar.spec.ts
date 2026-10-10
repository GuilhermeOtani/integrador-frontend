import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { OnibusService } from '../../service/onibus-service';

import { OnibusListar } from './onibus-listar';

describe('OnibusListar', () => {
  let component: OnibusListar;
  let fixture: ComponentFixture<OnibusListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnibusListar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnibusListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('atalho navega para manutenção com filtro de ônibus', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.verChamados({ id: 7 } as any);
    expect(navegar).toHaveBeenCalledOnceWith(['/manutencao'], { queryParams: { onibusId: 7 } });
  });

  it('conflito de exclusão preserva o registro e recomenda INATIVO', () => {
    const injector = fixture.debugElement.injector;
    const api = injector.get(OnibusService);
    const confirmar = injector.get(ConfirmationService);
    const mensagens = spyOn(injector.get(MessageService), 'add');
    spyOn(api, 'ExcluirOnibus').and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Ônibus possui chamados.' } })));
    spyOn(confirmar, 'confirm').and.callFake(c => { c.accept?.(); return confirmar; });
    const onibus = { id: 7 } as any;
    component.onibuss = [onibus]; component.deleteOnibus(onibus);
    expect(component.onibuss).toEqual([onibus]);
    expect(mensagens.calls.mostRecent().args[0].detail).toContain('Ônibus possui chamados.');
    expect(mensagens.calls.mostRecent().args[0].detail).toContain('INATIVO');
  });
});
