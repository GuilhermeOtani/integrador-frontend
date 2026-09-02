import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'redirecionarAposLogin']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit an invalid form', () => {
    component.entrar();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('logs in and redirects with valid credentials', () => {
    auth.login.and.returnValue(
      of({
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 7200,
        usuario: {
          id: 1,
          email: 'admin@teste.com',
          tipoPessoa: 'ADMIN',
          pessoaId: 1,
          nome: 'Admin',
          ativo: true,
        },
      }),
    );
    component.form.setValue({ email: 'admin@teste.com', senha: 'Senha123' });

    component.entrar();

    expect(auth.login).toHaveBeenCalledWith({ email: 'admin@teste.com', senha: 'Senha123' });
    expect(auth.redirecionarAposLogin).toHaveBeenCalled();
  });

  it('shows the unavailable-backend message for status zero', () => {
    auth.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })),
    );
    component.form.setValue({ email: 'admin@teste.com', senha: 'Senha123' });

    component.entrar();

    expect(component.erro()).toContain('Servidor indisponível');
  });
});
