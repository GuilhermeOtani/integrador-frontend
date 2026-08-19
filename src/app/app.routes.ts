import { Routes } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { AlunoListar } from './components/aluno/aluno-listar/aluno-listar';
import { FaculdadeListar } from './components/faculdade/faculdade-listar/faculdade-listar';
import { OnibusListar } from './components/onibus/onibus-listar/onibus-listar';
import { MotoristaListar } from './components/motorista/motorista-listar/motorista-listar';
import { ContaPagarComponent } from './components/conta-pagar/conta-pagar';
import { PontoEmbarqueListar } from './components/ponto-embarque/ponto-embarque-listar/ponto-embarque-listar';
import { RotaListar } from './components/rota/rota-listar/rota-listar';
import { GradeDiariaListar } from './components/grade-diaria/grade-diaria-listar/grade-diaria-listar';

export const routes: Routes = [
  { path: '', redirectTo: 'alunos', pathMatch: 'full' },
  { path: 'alunos', component: AlunoListar },
  { path: 'faculdades', component: FaculdadeListar },
  { path: 'onibuss', component: OnibusListar },
  { path: 'motoristas', component: MotoristaListar },
  { path: 'contapagar', component: ContaPagarComponent },
  { path: 'pontosembarque', component: PontoEmbarqueListar },
  { path: 'rotas', component: RotaListar },
   { path: 'grades', component: GradeDiariaListar },
  

];
