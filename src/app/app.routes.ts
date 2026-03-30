import { Routes } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { AlunoListar } from './components/aluno/aluno-listar/aluno-listar';
import { FaculdadeListar } from './components/faculdade/faculdade-listar/faculdade-listar';

export const routes: Routes = [
    {path: "", redirectTo: "alunos", pathMatch:"full"},
    {path:"alunos", component: AlunoListar},
    {path:"faculdades", component: FaculdadeListar},    
];


