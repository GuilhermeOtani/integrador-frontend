import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, guestGuard, roleGuard } from './auth.guards';

describe('auth guards', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/usuarios' } as RouterStateSnapshot;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['token', 'temPapel']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    router = TestBed.inject(Router);
  });

  it('sends guests to login and preserves the requested URL', () => {
    auth.token.and.returnValue(null);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?retorno=%2Fusuarios');

    const roleResult = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])(route, state)) as UrlTree;
    expect(router.serializeUrl(roleResult)).toBe('/login?retorno=%2Fusuarios');
  });

  it('allows authenticated users through authGuard', () => {
    auth.token.and.returnValue('token');
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBeTrue();
  });

  it('prevents authenticated users from returning to login', () => {
    auth.token.and.returnValue('token');
    const result = TestBed.runInInjectionContext(() => guestGuard(route, state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/perfil');
  });

  it('allows only the configured roles', () => {
    auth.token.and.returnValue('token');
    auth.temPapel.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])(route, state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/sem-permissao');

    auth.temPapel.and.returnValue(true);
    expect(TestBed.runInInjectionContext(() => roleGuard(['ADMIN'])(route, state))).toBeTrue();
  });
});
