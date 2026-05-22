import { Routes } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { AlunoListar } from './components/aluno/aluno-listar/aluno-listar';
import { FaculdadeListar } from './components/faculdade/faculdade-listar/faculdade-listar';
import { OnibusListar } from './components/onibus/onibus-listar/onibus-listar';
import { MotoristaListar } from './components/motorista/motorista-listar/motorista-listar';
import { ContaPagarComponent } from './components/conta-pagar/conta-pagar';
import { PontoEmbarqueListar } from './components/ponto-embarque/ponto-embarque-listar/ponto-embarque-listar';

export const routes: Routes = [
  { path: '', redirectTo: 'alunos', pathMatch: 'full' },
  { path: 'alunos', component: AlunoListar },
  { path: 'faculdades', component: FaculdadeListar },
  { path: 'onibuss', component: OnibusListar },
  { path: 'motoristas', component: MotoristaListar },
  { path: 'contapagar', component: ContaPagarComponent },
    { path: 'pontosembarque', component: PontoEmbarqueListar },

];
