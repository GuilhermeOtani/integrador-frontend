import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists accounts and people without accounts', () => {
    service.listar().subscribe();
    expect(http.expectOne('http://localhost:8080/usuarios').request.method).toBe('GET');

    service.listarPessoasSemUsuario().subscribe();
    expect(http.expectOne('http://localhost:8080/usuarios/pessoas-sem-usuario').request.method).toBe('GET');
  });

  it('creates a person account without sending a role', () => {
    service.criar({ pessoaId: 7, email: 'aluno@teste.com', senha: 'Senha123' }).subscribe();
    const request = http.expectOne('http://localhost:8080/usuarios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ pessoaId: 7, email: 'aluno@teste.com', senha: 'Senha123' });
    expect(request.request.body.tipoPessoa).toBeUndefined();
  });

  it('creates an administrator through the dedicated endpoint', () => {
    service.criarAdmin({ nome: 'Admin', email: 'admin@teste.com', senha: 'Senha123' }).subscribe();
    const request = http.expectOne('http://localhost:8080/usuarios/admin');
    expect(request.request.method).toBe('POST');
  });
});
