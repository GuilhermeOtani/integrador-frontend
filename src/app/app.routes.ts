import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./components/perfil/perfil').then((module) => module.Perfil),
    canActivate: [authGuard],
  },
  {
    path: 'sem-permissao',
    loadComponent: () =>
      import('./components/sem-permissao/sem-permissao').then((module) => module.SemPermissao),
    canActivate: [authGuard],
  },

  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios').then((module) => module.Usuarios),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'alunos',
    loadComponent: () =>
      import('./components/aluno/aluno-listar/aluno-listar').then((module) => module.AlunoListar),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'faculdades',
    loadComponent: () =>
      import('./components/faculdade/faculdade-listar/faculdade-listar').then(
        (module) => module.FaculdadeListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'onibus',
    loadComponent: () =>
      import('./components/onibus/onibus-listar/onibus-listar').then(
        (module) => module.OnibusListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  { path: 'onibuss', redirectTo: 'onibus', pathMatch: 'full' },
  {
    path: 'motoristas',
    loadComponent: () =>
      import('./components/motorista/motorista-listar/motorista-listar').then(
        (module) => module.MotoristaListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'contapagar',
    loadComponent: () =>
      import('./components/conta-pagar/conta-pagar').then(
        (module) => module.ContaPagarComponent,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },

  {
    path: 'pontosembarque',
    loadComponent: () =>
      import('./components/ponto-embarque/ponto-embarque-listar/ponto-embarque-listar').then(
        (module) => module.PontoEmbarqueListar,
      ),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'rotas',
    loadComponent: () =>
      import('./components/rota/rota-listar/rota-listar').then((module) => module.RotaListar),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'grades',
    loadComponent: () =>
      import('./components/grade-diaria/grade-diaria-listar/grade-diaria-listar').then(
        (module) => module.GradeDiariaListar,
      ),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'minhas-viagens',
    loadComponent: () =>
      import('./components/viagem/minhas-viagens/minhas-viagens').then(
        (module) => module.MinhasViagens,
      ),
    canActivate: [roleGuard(['MOTORISTA'])],
  },

  { path: '', redirectTo: 'perfil', pathMatch: 'full' },
  { path: '**', redirectTo: 'perfil' },
];
