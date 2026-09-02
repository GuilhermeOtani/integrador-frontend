import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { of, throwError } from 'rxjs';
import { PessoaDisponivelResponse, UsuarioResumo } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioService } from '../../core/auth/usuario.service';
import { Usuarios } from './usuarios';

describe('Usuarios', () => {
  let fixture: ComponentFixture<Usuarios>;
  let component: Usuarios;
  let service: jasmine.SpyObj<UsuarioService>;
  let messages: jasmine.SpyObj<MessageService>;
  let logout: jasmine.Spy;
  let confirmationService: ConfirmationService;

  const admin: UsuarioResumo = {
    id: 1,
    email: 'admin@teste.com',
    tipoPessoa: 'ADMIN',
    pessoaId: 1,
    nome: 'Administrador',
    ativo: true,
  };
  const aluno: UsuarioResumo = {
    id: 7,
    email: 'aluno@teste.com',
    tipoPessoa: 'ALUNO',
    pessoaId: 7,
    nome: 'Aluno Teste',
    ativo: true,
  };
  const pessoa: PessoaDisponivelResponse = {
    id: 8,
    nome: 'Motorista Teste',
    tipoPessoa: 'MOTORISTA',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'listar',
      'listarPessoasSemUsuario',
      'criar',
      'criarAdmin',
      'atualizarEmail',
      'redefinirSenha',
      'atualizarStatus',
      'excluirAcesso',
    ]);
    service.listar.and.returnValue(of([admin, aluno]));
    service.listarPessoasSemUsuario.and.returnValue(of([pessoa]));
    service.criar.and.returnValue(of(aluno));
    service.criarAdmin.and.returnValue(of(admin));
    service.atualizarEmail.and.returnValue(of(aluno));
    service.redefinirSenha.and.returnValue(of(void 0));
    service.atualizarStatus.and.returnValue(of(aluno));
    service.excluirAcesso.and.returnValue(of(void 0));
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    logout = jasmine.createSpy('logout');
    const auth = { usuario: () => admin, logout } as unknown as AuthService;

    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [
        provideNoopAnimations(),
        { provide: UsuarioService, useValue: service },
        { provide: AuthService, useValue: auth },
        { provide: MessageService, useValue: messages },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    fixture.detectChanges();
  });

  it('carrega contas, pessoas disponíveis e os status recebidos', () => {
    expect(component.usuarios()).toEqual([admin, aluno]);
    expect(component.usuarios().every((usuario) => typeof usuario.ativo === 'boolean')).toBeTrue();
    expect(component.pessoasDisponiveis()).toEqual([pessoa]);
  });

  it('desabilita desativação e exclusão da própria conta no menu', () => {
    const menu = { toggle: jasmine.createSpy('toggle') } as unknown as Menu;

    component.abrirMenu(new Event('click'), admin, menu);

    const itens = component.itensAcoes();
    expect(itens.find((item) => item.label === 'Desativar acesso')?.disabled).toBeTrue();
    expect(itens.find((item) => item.label?.startsWith('Excluir acesso'))?.disabled).toBeTrue();
    expect(menu.toggle).toHaveBeenCalled();
  });

  it('mantém o formulário de criação aberto e informa o conflito 409', () => {
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
      email: 'motorista@teste.com',
      senha: 'senha-segura',
      confirmacao: 'senha-segura',
    });

    component.criarConta();

    expect(component.dialogConta).toBeTrue();
    expect(component.erroConta()).toContain('e-mail');
  });

  it('recarrega contas e pessoas disponíveis após criar uma conta', () => {
    component.abrirConta(pessoa);
    component.formConta.patchValue({
      email: 'motorista@teste.com',
      senha: 'senha-segura',
      confirmacao: 'senha-segura',
    });

    component.criarConta();

    expect(component.dialogConta).toBeFalse();
    expect(service.criar).toHaveBeenCalledWith({
      pessoaId: pessoa.id,
      email: 'motorista@teste.com',
      senha: 'senha-segura',
    });
    expect(service.listar).toHaveBeenCalledTimes(2);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(2);
  });

  it('normaliza o e-mail alterado e atualiza somente a tabela de usuários', () => {
    component.abrirEdicaoEmail(aluno);
    component.formEmail.setValue({ email: '  NOVO@TESTE.COM  ' });

    component.salvarEmail();

    expect(service.atualizarEmail).toHaveBeenCalledWith(aluno.id, 'NOVO@TESTE.COM');
    expect(component.dialogEmail).toBeFalse();
    expect(service.listar).toHaveBeenCalledTimes(2);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(1);
  });

  it('não envia uma atualização quando o e-mail normalizado não mudou', () => {
    component.abrirEdicaoEmail(aluno);
    component.formEmail.setValue({ email: '  ALUNO@TESTE.COM ' });

    component.salvarEmail();

    expect(component.emailSemAlteracao()).toBeTrue();
    expect(service.atualizarEmail).not.toHaveBeenCalled();
  });

  it('encerra a sessão após editar o próprio e-mail', () => {
    component.abrirEdicaoEmail(admin);
    component.formEmail.setValue({ email: 'novo-admin@teste.com' });

    component.salvarEmail();

    expect(service.atualizarEmail).toHaveBeenCalledWith(admin.id, 'novo-admin@teste.com');
    expect(logout).toHaveBeenCalled();
    expect(service.listar).toHaveBeenCalledTimes(1);
  });

  it('redefine a própria senha, limpa o formulário e encerra a sessão', () => {
    component.abrirRedefinicaoSenha(admin);
    component.formSenha.setValue({ senha: 'NovaSenha123', confirmacao: 'NovaSenha123' });

    component.salvarSenha();

    expect(service.redefinirSenha).toHaveBeenCalledWith(admin.id, 'NovaSenha123');
    expect(component.formSenha.controls.senha.value).toBe('');
    expect(component.dialogSenha).toBeFalse();
    expect(logout).toHaveBeenCalled();
  });

  it('confirma a desativação e permite reativação direta', () => {
    let confirmacao: Confirmation | undefined;
    spyOn(confirmationService, 'confirm').and.callFake((valor) => {
      confirmacao = valor;
      return confirmationService;
    });

    component.confirmarDesativacao(aluno);
    expect(confirmacao?.message).toContain(aluno.email);
    confirmacao?.accept?.();
    expect(service.atualizarStatus).toHaveBeenCalledWith(aluno.id, false);

    const inativo = { ...aluno, ativo: false };
    component.atualizarStatus(inativo, true);
    expect(service.atualizarStatus).toHaveBeenCalledWith(inativo.id, true);
  });

  it('confirma a exclusão e recarrega também pessoas sem usuário', () => {
    let confirmacao: Confirmation | undefined;
    spyOn(confirmationService, 'confirm').and.callFake((valor) => {
      confirmacao = valor;
      return confirmationService;
    });

    component.confirmarExclusao(aluno);
    expect(confirmacao?.message).toContain('pessoa cadastrada será preservada');
    confirmacao?.accept?.();

    expect(service.excluirAcesso).toHaveBeenCalledWith(aluno.id);
    expect(service.listar).toHaveBeenCalledTimes(2);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(2);
  });

  it('associa erros 400 ao campo e mantém o diálogo aberto', () => {
    service.atualizarEmail.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { errors: { email: 'E-mail inválido.' } },
          }),
      ),
    );
    component.abrirEdicaoEmail(aluno);
    component.formEmail.setValue({ email: 'novo@teste.com' });

    component.salvarEmail();

    expect(component.formEmail.controls.email.getError('servidor')).toBe('E-mail inválido.');
    expect(component.dialogEmail).toBeTrue();
  });

  it('mantém o diálogo aberto e mostra a causa em conflito 409', () => {
    service.atualizarEmail.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'O e-mail informado já possui uma conta.' },
          }),
      ),
    );
    component.abrirEdicaoEmail(aluno);
    component.formEmail.setValue({ email: 'duplicado@teste.com' });

    component.salvarEmail();

    expect(component.dialogEmail).toBeTrue();
    expect(component.erroEmail()).toContain('já possui');
  });

  it('fecha o diálogo e recarrega as duas listas em erro 404', () => {
    service.atualizarEmail.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { detail: 'A conta não foi encontrada.' },
          }),
      ),
    );
    component.abrirEdicaoEmail(aluno);
    component.formEmail.setValue({ email: 'novo@teste.com' });

    component.salvarEmail();

    expect(component.dialogEmail).toBeFalse();
    expect(service.listar).toHaveBeenCalledTimes(2);
    expect(service.listarPessoasSemUsuario).toHaveBeenCalledTimes(2);
    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ summary: 'Conta não encontrada' }),
    );
  });
});
