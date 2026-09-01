import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sem-permissao',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './sem-permissao.html',
  styleUrl: './sem-permissao.css',
})
export class SemPermissao {
  private readonly auth = inject(AuthService);

  voltar(): void {
    this.auth.redirecionarAposLogin();
  }
}
