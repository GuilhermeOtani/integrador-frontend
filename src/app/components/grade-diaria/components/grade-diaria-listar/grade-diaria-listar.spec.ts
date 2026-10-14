import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GradeDiariaListar } from './grade-diaria-listar';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('GradeDiariaListar', () => {
  let component: GradeDiariaListar;
  let fixture: ComponentFixture<GradeDiariaListar>;
  const papel = signal('ADMIN');

  beforeEach(async () => {
    papel.set('ADMIN');
    await TestBed.configureTestingModule({
      imports: [GradeDiariaListar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(), { provide: AuthService, useValue: { temPapel: (...papeis: string[]) => papeis.includes(papel()) } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeDiariaListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('atalho administrativo apenas navega para programação por e-mail', () => {
    const link = fixture.nativeElement.querySelector('a[href="/programacao-email"]');
    expect(link).not.toBeNull(); expect(link.textContent).toContain('Enviar programação de hoje');
  });
  it('aluno não recebe atalho de envio', () => {
    papel.set('ALUNO'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/programacao-email"]')).toBeNull();
  });

  it('cancelar edição não altera viagens, faculdades ou IDs da listagem', () => {
    const original = { id: 1, diaSemana: 'SEGUNDA', viagens: [
      { id: 9, onibusId: 3, faculdades: [{ id: 5, nome: 'Faculdade' }] },
    ] } as any;
    component.grades = [original];
    component.editGrade(original);
    component.grade.viagens[0].onibusId = 7;
    component.grade.viagens[0].faculdades[0].nome = 'Modificada';
    component.grade.viagens.splice(0, 1);
    component.hideDialog();
    expect(original.viagens[0].id).toBe(9);
    expect(original.viagens[0].onibusId).toBe(3);
    expect(original.viagens[0].faculdades[0].nome).toBe('Faculdade');
  });
});
