import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Sidebar } from './sidebar';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { Papel } from '../../../../core/auth/models/auth.models';

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

  it('programação por e-mail aparece somente para ADMIN, sem WhatsApp', () => {
    for (const atual of ['ADMIN', 'ALUNO', 'MOTORISTA'] as Papel[]) {
      papel.set(atual);
      const rotas = component.secoes().flatMap(s => s.itens.map(i => i.rota));
      expect(rotas.includes('/programacao-email')).toBe(atual === 'ADMIN');
      expect(rotas.includes('/whatsapp')).toBeFalse();
    }
  });

  it('Início é o primeiro item de todos os papéis e preserva Meu perfil', () => {
    for (const atual of ['ADMIN', 'ALUNO', 'MOTORISTA'] as Papel[]) {
      papel.set(atual);
      expect(component.secoes()[0].itens[0].rota).toBe('/inicio');
      expect(component.secoes()[0].itens[1].rota).toBe('/perfil');
    }
  });

  it('mostra chamados somente aos solicitantes e manutenção somente ao ADMIN', () => {
    for (const atual of ['ADMIN', 'ALUNO', 'MOTORISTA'] as Papel[]) {
      papel.set(atual);
      const rotas = component.secoes().flatMap(s => s.itens.map(i => i.rota));
      expect(rotas.includes('/manutencao')).toBe(atual === 'ADMIN');
      expect(rotas.includes('/meus-chamados')).toBe(atual !== 'ADMIN');
      expect(rotas.includes('/onibus')).toBe(atual === 'ADMIN');
    }
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
