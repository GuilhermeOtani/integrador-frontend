import { computed, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth/auth.service';

interface ItemMenu {
  label: string;
  icon: string;
  rota: string;
}

interface SecaoMenu {
  titulo: string;
  itens: ItemMenu[];
}

const PERFIL: ItemMenu = { label: 'Meu perfil', icon: 'pi pi-user', rota: '/perfil' };

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [
    AvatarModule,
    ButtonModule,
    DrawerModule,
    RippleModule,
    CommonModule,
    RouterModule,
    TooltipModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly auth = inject(AuthService);
  visible = false;

  readonly secoes = computed<SecaoMenu[]>(() => {
    if (this.auth.temPapel('ADMIN')) {
      return [
        {
          titulo: 'Conta',
          itens: [
            PERFIL,
            { label: 'Usuários', icon: 'pi pi-shield', rota: '/usuarios' },
          ],
        },
        {
          titulo: 'Cadastros base',
          itens: [
            { label: 'Alunos', icon: 'pi pi-users', rota: '/alunos' },
            { label: 'Faculdades', icon: 'pi pi-building', rota: '/faculdades' },
            { label: 'Motoristas', icon: 'pi pi-id-card', rota: '/motoristas' },
            { label: 'Ônibus', icon: 'pi pi-truck', rota: '/onibus' },
          ],
        },
        {
          titulo: 'Logística',
          itens: [
            { label: 'Pontos de embarque', icon: 'pi pi-map-marker', rota: '/pontosembarque' },
            { label: 'Rotas', icon: 'pi pi-map', rota: '/rotas' },
            { label: 'Grades', icon: 'pi pi-calendar', rota: '/grades' },
          ],
        },
        {
          titulo: 'Financeiro',
          itens: [{ label: 'Contas a pagar', icon: 'pi pi-money-bill', rota: '/contapagar' }],
        },
      ];
    }

    if (this.auth.temPapel('ALUNO')) {
      return [
        { titulo: 'Conta', itens: [PERFIL] },
        {
          titulo: 'Transporte',
          itens: [
            { label: 'Rotas', icon: 'pi pi-map', rota: '/rotas' },
            { label: 'Pontos de embarque', icon: 'pi pi-map-marker', rota: '/pontosembarque' },
            { label: 'Grades', icon: 'pi pi-calendar', rota: '/grades' },
          ],
        },
      ];
    }

    return [
      { titulo: 'Conta', itens: [PERFIL] },
      {
        titulo: 'Operação',
        itens: [{ label: 'Minhas viagens', icon: 'pi pi-directions', rota: '/minhas-viagens' }],
      },
    ];
  });

  readonly iniciais = computed(() => {
    const nome = this.auth.usuario()?.nome?.trim() ?? '';
    return nome
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('') || 'U';
  });

  readonly rotuloPapel = computed(() => {
    const papel = this.auth.papel();
    return papel === 'ADMIN' ? 'Administrador' : papel === 'ALUNO' ? 'Aluno' : 'Motorista';
  });

  sair(): void {
    this.visible = false;
    this.auth.logout();
  }
}
