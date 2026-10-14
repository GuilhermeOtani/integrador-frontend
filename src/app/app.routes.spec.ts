import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  UrlTree,
  provideRouter,
  RouterStateSnapshot,
} from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/service/auth.service';
import { Papel } from './core/auth/models/auth.models';

describe('app routes', () => {
  for (const [path, papeis] of [
    ['inicio', ['ADMIN', 'ALUNO', 'MOTORISTA']],
    ['whatsapp', ['ADMIN']],
    ['manutencao', ['ADMIN']], ['meus-chamados', ['ALUNO', 'MOTORISTA']],
  ] as [string, Papel[]][]) {
    for (const papel of [null, 'ADMIN', 'ALUNO', 'MOTORISTA'] as (Papel | null)[]) {
      it(`${path} autoriza corretamente ${papel ?? 'anônimo'}`, () => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: {
          token: () => papel ? 'jwt' : null,
          temPapel: (...permitidos: Papel[]) => papel !== null && permitidos.includes(papel),
        } }] });
        const guard = routes.find(r => r.path === path)!.canActivate![0] as CanActivateFn;
        const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url: `/${path}` } as RouterStateSnapshot));
        if (papel !== null && papeis.includes(papel)) expect(result).toBeTrue();
        else {
          const url = TestBed.inject(Router).serializeUrl(result as UrlTree);
          expect(url).toContain(papel === null ? '/login' : '/sem-permissao');
        }
      });
    }
  }
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

  it('raiz e rota desconhecida abrem início, mantendo perfil', () => {
    expect(routes.find(r => r.path === '')?.redirectTo).toBe('inicio');
    expect(routes.find(r => r.path === '**')?.redirectTo).toBe('inicio');
    expect(routes.find(r => r.path === 'perfil')?.loadComponent).toBeDefined();
  });
});
