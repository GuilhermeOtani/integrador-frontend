import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  RouterStateSnapshot,
} from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('app routes', () => {
  it('protege Contas a receber com o papel ADMIN', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['token', 'temPapel']);
    auth.token.and.returnValue('token');
    auth.temPapel.and.returnValue(true);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    const route = routes.find((candidate) => candidate.path === 'contas-receber');
    expect(route).toBeDefined();
    expect(route?.canActivate?.length).toBe(1);

    const guard = route!.canActivate![0] as CanActivateFn;
    const result = TestBed.runInInjectionContext(() =>
      guard(
        {} as ActivatedRouteSnapshot,
        { url: '/contas-receber' } as RouterStateSnapshot,
      ),
    );

    expect(result).toBeTrue();
    expect(auth.temPapel).toHaveBeenCalledOnceWith('ADMIN');
  });
});
