import { Routes } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { AlunoListar } from './components/aluno/aluno-listar/aluno-listar';

export const routes: Routes = [
    {path: "", redirectTo: "alunos", pathMatch:"full"},
    {path:"alunos", component: AlunoListar    }

];


