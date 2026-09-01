import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let messages: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['token', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    auth.token.and.returnValue('jwt-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: MessageService, useValue: messages },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the token only to backend requests', () => {
    http.get('http://localhost:8080/auth/me').subscribe();
    const backend = controller.expectOne('http://localhost:8080/auth/me');
    expect(backend.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    backend.flush({});

    http.get('https://example.com/data').subscribe();
    const external = controller.expectOne('https://example.com/data');
    expect(external.request.headers.has('Authorization')).toBeFalse();
    external.flush({});

    http.get('http://localhost:8080.example.com/data').subscribe();
    const similarOrigin = controller.expectOne('http://localhost:8080.example.com/data');
    expect(similarOrigin.request.headers.has('Authorization')).toBeFalse();
    similarOrigin.flush({});
  });

  it('does not add a token to login', () => {
    http.post('http://localhost:8080/auth/login', {}).subscribe();
    const request = controller.expectOne('http://localhost:8080/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('logs out after a backend 401', () => {
    http.get('http://localhost:8080/auth/me').subscribe({ error: () => undefined });
    controller.expectOne('http://localhost:8080/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalled();
  });

  it('redirects to the forbidden page after a 403', () => {
    http.get('http://localhost:8080/usuarios').subscribe({ error: () => undefined });
    controller.expectOne('http://localhost:8080/usuarios').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sem-permissao');
  });

  it('reports an unavailable backend without logging out', () => {
    http.get('http://localhost:8080/auth/me').subscribe({ error: () => undefined });
    controller.expectOne('http://localhost:8080/auth/me').error(new ProgressEvent('error'));
    expect(messages.add).toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
