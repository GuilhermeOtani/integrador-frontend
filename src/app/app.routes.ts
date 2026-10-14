import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./components/dashboard/components/inicio/inicio').then(m => m.Inicio),
    canActivate: [authGuard, roleGuard(['ADMIN', 'ALUNO', 'MOTORISTA'])],
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/components/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./components/perfil/components/perfil/perfil').then((module) => module.Perfil),
    canActivate: [authGuard],
  },
  {
    path: 'sem-permissao',
    loadComponent: () =>
      import('./components/sem-permissao/components/sem-permissao/sem-permissao').then((module) => module.SemPermissao),
    canActivate: [authGuard],
  },

  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/components/usuarios/usuarios').then((module) => module.Usuarios),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'whatsapp',
    loadComponent: () => import('./components/whatsapp/components/whatsapp-admin/whatsapp-admin').then(m => m.WhatsappAdmin),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'alunos',
    loadComponent: () =>
      import('./components/aluno/components/aluno-listar/aluno-listar').then((module) => module.AlunoListar),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'faculdades',
    loadComponent: () =>
      import('./components/faculdade/components/faculdade-listar/faculdade-listar').then(
        (module) => module.FaculdadeListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'onibus',
    loadComponent: () =>
      import('./components/onibus/components/onibus-listar/onibus-listar').then(
        (module) => module.OnibusListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  { path: 'onibuss', redirectTo: 'onibus', pathMatch: 'full' },
  {
    path: 'motoristas',
    loadComponent: () =>
      import('./components/motorista/components/motorista-listar/motorista-listar').then(
        (module) => module.MotoristaListar,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'contapagar',
    loadComponent: () =>
      import('./components/conta-pagar/components/conta-pagar/conta-pagar').then(
        (module) => module.ContaPagarComponent,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'contas-receber',
    loadComponent: () =>
      import('./components/conta-receber/components/contas-receber/contas-receber').then(
        (module) => module.ContasReceber,
      ),
    canActivate: [roleGuard(['ADMIN'])],
  },

  {
    path: 'pontosembarque',
    loadComponent: () =>
      import('./components/ponto-embarque/components/ponto-embarque-listar/ponto-embarque-listar').then(
        (module) => module.PontoEmbarqueListar,
      ),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'rotas',
    loadComponent: () =>
      import('./components/rota/components/rota-listar/rota-listar').then((module) => module.RotaListar),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'grades',
    loadComponent: () =>
      import('./components/grade-diaria/components/grade-diaria-listar/grade-diaria-listar').then(
        (module) => module.GradeDiariaListar,
      ),
    canActivate: [roleGuard(['ADMIN', 'ALUNO'])],
  },
  {
    path: 'minhas-matriculas',
    loadComponent: () =>
      import('./components/conta-receber/components/minhas-matriculas/minhas-matriculas').then(
        (module) => module.MinhasMatriculas,
      ),
    canActivate: [roleGuard(['ALUNO'])],
  },
  {
    path: 'minhas-viagens',
    loadComponent: () =>
      import('./components/viagem/components/minhas-viagens/minhas-viagens').then(
        (module) => module.MinhasViagens,
      ),
    canActivate: [roleGuard(['MOTORISTA'])],
  },

  {
    path: 'meus-chamados',
    loadComponent: () => import('./components/manutencao/components/meus-chamados/meus-chamados').then(m => m.MeusChamados),
    canActivate: [roleGuard(['ALUNO', 'MOTORISTA'])],
  },
  {
    path: 'manutencao',
    loadComponent: () => import('./components/manutencao/components/manutencao-admin/manutencao-admin').then(m => m.ManutencaoAdmin),
    canActivate: [roleGuard(['ADMIN'])],
  },

  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
