import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { AlunoService } from '../../service/aluno-service';

import { AlunoListar } from './aluno-listar';

describe('AlunoListar', () => {
  let component: AlunoListar;
  let fixture: ComponentFixture<AlunoListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlunoListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra conflito de exclusão sem remover aluno com chamados', () => {
    const injector = fixture.debugElement.injector;
    const confirmar = injector.get(ConfirmationService);
    const mensagens = spyOn(injector.get(MessageService), 'add');
    spyOn(injector.get(AlunoService), 'ExcluirAlunos').and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Pessoa possui chamados de manutenção.' } })));
    spyOn(confirmar, 'confirm').and.callFake(c => { c.accept?.(); return confirmar; });
    const aluno = { id: 2, nome: 'Aluno' } as any;
    component.alunos = [aluno]; component.deleteAluno(aluno);
    expect(component.alunos).toEqual([aluno]);
    expect(mensagens.calls.mostRecent().args[0].detail).toBe('Pessoa possui chamados de manutenção.');
  });
});
