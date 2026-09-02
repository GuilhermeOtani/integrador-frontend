import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AUTH_STORAGE_KEY, AuthService } from './auth.service';
import { LoginResponse, Sessao } from './auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  const response: LoginResponse = {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: 7200,
    usuario: {
      id: 1,
      email: 'admin@teste.com',
      tipoPessoa: 'ADMIN',
      pessoaId: 1,
      nome: 'Administrador',
      ativo: true,
    },
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    service.logout();
    http.verify();
    sessionStorage.clear();
  });

  it('stores a valid session after login', () => {
    service.login({ email: 'admin@teste.com', senha: 'Senha123' }).subscribe();

    const request = http.expectOne('http://localhost:8080/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush(response);

    expect(service.autenticado()).toBeTrue();
    expect(service.papel()).toBe('ADMIN');
    expect(service.token()).toBe('jwt-token');
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
  });

  it('restores a valid session after the service is recreated', () => {
    const sessao: Sessao = {
      accessToken: 'restored-token',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 60_000,
      usuario: response.usuario,
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessao));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    expect(service.token()).toBe('restored-token');
  });

  it('rejects malformed stored sessions', () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, '{invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    expect(service.autenticado()).toBeFalse();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('rejects restored sessions that are inactive or do not contain the active flag', () => {
    const sessaoAntiga = {
      accessToken: 'old-token',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 60_000,
      usuario: { ...response.usuario, ativo: undefined },
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessaoAntiga));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    expect(service.autenticado()).toBeFalse();

    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...sessaoAntiga, usuario: { ...response.usuario, ativo: false } }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    expect(service.autenticado()).toBeFalse();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('logs out automatically when the expiration timer fires', fakeAsync(() => {
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    service.login({ email: 'admin@teste.com', senha: 'Senha123' }).subscribe();
    const request = http.expectOne('http://localhost:8080/auth/login');
    request.flush({ ...response, expiresIn: 1 });

    tick(1001);

    expect(service.autenticado()).toBeFalse();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  }));

  it('maps the initial destination by role', () => {
    expect(service.destinoInicial()).toBe('/rotas');
    service.login({ email: 'admin@teste.com', senha: 'Senha123' }).subscribe();
    http.expectOne('http://localhost:8080/auth/login').flush(response);
    expect(service.destinoInicial()).toBe('/alunos');
  });
});
