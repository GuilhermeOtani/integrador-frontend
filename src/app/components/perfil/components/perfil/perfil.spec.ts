import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { Papel } from '../../../../core/auth/models/auth.models';
import { environment } from '../../../../../environments/environment';
import { assinaturaFixture } from '../../../whatsapp/testing/whatsapp.fixtures';
import { Perfil } from './perfil';

describe('Perfil com WhatsApp', () => {
  for (const papel of ['ADMIN', 'ALUNO', 'MOTORISTA'] as Papel[]) {
    it(`assinatura respeita papel ${papel} e preserva perfil mesmo com integração indisponível`, async () => {
      TestBed.configureTestingModule({ imports: [Perfil], providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), { provide: AuthService, useValue: {
        carregarPerfil: () => of({ id: 1, email: 'teste@teste.com', tipoPessoa: papel, pessoa: { id: 10, nome: 'Pessoa Teste', telefone: null, cpfCnpj: null, aluno: null, motorista: null } }),
      } }] });
      const http = TestBed.inject(HttpTestingController); const fixture = TestBed.createComponent(Perfil); fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Pessoa Teste'); expect(fixture.nativeElement.textContent).toContain('Dados pessoais');
      if (papel === 'ADMIN') { http.expectNone(`${environment.apiUrl}/whatsapp/minha-assinatura`); expect(fixture.nativeElement.querySelector('app-assinatura-whatsapp')).toBeNull(); }
      else {
        const req = http.expectOne(`${environment.apiUrl}/whatsapp/minha-assinatura`);
        if (papel === 'ALUNO') req.flush(assinaturaFixture); else req.flush({ detail: 'Integração indisponível' }, { status: 503, statusText: 'Unavailable' });
        await fixture.whenStable(); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Pessoa Teste'); expect(fixture.nativeElement.querySelector('app-assinatura-whatsapp')).not.toBeNull();
      }
      fixture.destroy(); http.verify();
    });
  }
});
