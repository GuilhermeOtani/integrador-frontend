import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { PessoaDisponivelResponse, UsuarioResumo } from '../../core/auth/auth.models';
import { UsuarioService } from '../../core/auth/usuario.service';
import { Usuarios } from './usuarios';

describe('Usuarios', () => {
  let fixture: ComponentFixture<Usuarios>;
  let component: Usuarios;
  let service: jasmine.SpyObj<UsuarioService>;

  const usuario: UsuarioResumo = {
    id: 1,
    email: 'admin@teste.com',
    tipoPessoa: 'ADMIN',
    pessoaId: 1,
    nome: 'Administrador',
  };
  const pessoa: PessoaDisponivelResponse = {
    id: 7,
    nome: 'Aluno Teste',
    tipoPessoa: 'ALUNO',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'listar',
      'listarPessoasSemUsuario',
      'criar',
      'criarAdmin',
    ]);
    service.listar.and.returnValue(of([usuario]));
    service.listarPessoasSemUsuario.and.returnValue(of([pessoa]));
    service.criar.and.returnValue(of(usuario));
    service.criarAdmin.and.returnValue(of(usuario));

    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [
        provideNoopAnimations(),
        { provide: UsuarioService, useValue: service },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega contas e pessoas sem usuário', () => {
    expect(component.usuarios()).toEqual([usuario]);
    expect(component.pessoasDisponiveis()).toEqual([pessoa]);
    expect(service.listar).toHaveBeenCalledTimes(1);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(1);
  });

  it('mantém o formulário aberto e informa o conflito 409', () => {
    service.criar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'O e-mail informado já possui uma conta.' },
          }),
      ),
    );
    component.abrirConta(pessoa);
    component.formConta.patchValue({
      email: 'aluno@teste.com',
      senha: 'senha-segura',
      confirmacao: 'senha-segura',
    });

    component.criarConta();

    expect(component.dialogConta).toBeTrue();
    expect(component.erroConta()).toContain('e-mail');
  });

  it('fecha o formulário e recarrega as duas listas após criar uma conta', () => {
    component.abrirConta(pessoa);
    component.formConta.patchValue({
      email: 'aluno@teste.com',
      senha: 'senha-segura',
      confirmacao: 'senha-segura',
    });

    component.criarConta();

    expect(component.dialogConta).toBeFalse();
    expect(service.criar).toHaveBeenCalledWith({
      pessoaId: pessoa.id,
      email: 'aluno@teste.com',
      senha: 'senha-segura',
    });
    expect(service.listar).toHaveBeenCalledTimes(2);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(2);
  });
});
