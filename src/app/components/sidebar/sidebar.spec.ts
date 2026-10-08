import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Sidebar } from './sidebar';
import { AuthService } from '../../core/auth/auth.service';
import { Papel } from '../../core/auth/auth.models';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  const papel = signal<Papel | null>('ALUNO');
  const usuario = signal({
    id: 1,
    email: 'aluno@teste.com',
    tipoPessoa: 'ALUNO' as Papel,
    pessoaId: 10,
    nome: 'Aluno Teste',
    ativo: true,
  });
  const authMock = {
    papel,
    usuario,
    temPapel: (...papeis: Papel[]) => {
      const atual = papel();
      return atual !== null && papeis.includes(atual);
    },
    logout: jasmine.createSpy('logout'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra Minhas matrículas somente para aluno', () => {
    papel.set('ALUNO');
    const rotasAluno = component.secoes().flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasAluno).toContain('/minhas-matriculas');

    papel.set('ADMIN');
    const rotasAdmin = component.secoes().flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasAdmin).not.toContain('/minhas-matriculas');

    papel.set('MOTORISTA');
    const rotasMotorista = component
      .secoes()
      .flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasMotorista).not.toContain('/minhas-matriculas');
  });

  it('mostra Contas a receber somente para administrador', () => {
    papel.set('ADMIN');
    const rotasAdmin = component.secoes().flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasAdmin).toContain('/contas-receber');

    papel.set('ALUNO');
    const rotasAluno = component.secoes().flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasAluno).not.toContain('/contas-receber');

    papel.set('MOTORISTA');
    const rotasMotorista = component
      .secoes()
      .flatMap((secao) => secao.itens.map((item) => item.rota));
    expect(rotasMotorista).not.toContain('/contas-receber');
  });
});
