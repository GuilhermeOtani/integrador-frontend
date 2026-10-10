import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { MotoristaService } from '../../service/motorista-service';

import { MotoristaListar } from './motorista-listar';

describe('MotoristaListar', () => {
  let component: MotoristaListar;
  let fixture: ComponentFixture<MotoristaListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristaListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MotoristaListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra conflito de exclusão sem remover motorista com chamados', () => {
    const injector = fixture.debugElement.injector;
    const confirmar = injector.get(ConfirmationService);
    const mensagens = spyOn(injector.get(MessageService), 'add');
    spyOn(injector.get(MotoristaService), 'ExcluirMotoristas').and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Pessoa possui chamados de manutenção.' } })));
    spyOn(confirmar, 'confirm').and.callFake(c => { c.accept?.(); return confirmar; });
    const motorista = { id: 2, nome: 'Motorista' } as any;
    component.motoristas = [motorista]; component.deleteMotorista(motorista);
    expect(component.motoristas).toEqual([motorista]);
    expect(mensagens.calls.mostRecent().args[0].detail).toBe('Pessoa possui chamados de manutenção.');
  });
});
