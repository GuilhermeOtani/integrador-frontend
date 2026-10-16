import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/service/auth.service';
import { MeResponse, Papel } from '../../../../core/auth/models/auth.models';
import { Perfil } from './perfil';

function dados(papel: Papel): MeResponse {
  return { id: 1, email: 'conta@teste.com', tipoPessoa: papel, pessoa: { id: 9, nome: 'Pessoa de teste',
    cpfCnpj: '111.222.333-44', telefone: '(44) 99999-9999',
    aluno: papel === 'ALUNO' ? { matricula: '123', statusMatricula: 'PENDENTE', dataCadastro: '2026-10-16', mensalidade: 400, faculdadeId: 2 } : null,
    motorista: papel === 'MOTORISTA' ? { cnh: '987654321', salario: 2000 } : null } };
}

describe('Apresentação do perfil', () => {
  let auth: jasmine.SpyObj<AuthService>;
  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['carregarPerfil']);
    TestBed.configureTestingModule({ imports: [Perfil], providers: [{ provide: AuthService, useValue: auth }] });
  });
  function renderizar(p: MeResponse) {
    auth.carregarPerfil.and.returnValue(of(p)); const f = TestBed.createComponent(Perfil); f.detectChanges(); return f;
  }
  for (const papel of ['ADMIN', 'ALUNO', 'MOTORISTA'] as Papel[]) {
    it(`${papel}: preserva identificação e somente os cartões disponíveis`, () => {
      const f = renderizar(dados(papel)); const el = f.nativeElement as HTMLElement;
      expect(el.querySelector('#perfil-nome')?.textContent).toBe('Pessoa de teste');
      expect(el.querySelector('.perfil-email')?.textContent).toBe('conta@teste.com');
      expect(el.querySelectorAll('.perfil-cartao').length).toBe(papel === 'ADMIN' ? 1 : 2);
      expect(el.querySelectorAll('.profile-list dd').length).toBe(papel === 'ALUNO' ? 7 : papel === 'MOTORISTA' ? 5 : 3);
      expect(el.textContent).toContain(papel === 'ADMIN' ? 'Administrador' : papel === 'ALUNO' ? 'Dados acadêmicos' : 'Dados profissionais');
      for (const dd of el.querySelectorAll('dd')) expect(getComputedStyle(dd).textAlign).toBe('left');
      expect(el.querySelector('button,input')).toBeNull(); expect(auth.carregarPerfil).toHaveBeenCalledTimes(1);
      if (papel === 'ADMIN') {
        expect(el.querySelector('#titulo-academicos,#titulo-profissionais')).toBeNull();
        const grid = el.querySelector('.perfil-cartoes')!;
        expect(grid.children.length).toBe(1);
      }
    });
    it(`${papel}: mantém os rótulos de dados ausentes sem criar campos de edição`, () => {
      const p = dados(papel); p.pessoa.cpfCnpj = null; p.pessoa.telefone = null;
      if (p.pessoa.aluno) Object.assign(p.pessoa.aluno, { matricula: null, statusMatricula: null, dataCadastro: null, mensalidade: null });
      if (p.pessoa.motorista) Object.assign(p.pessoa.motorista, { cnh: null, salario: null });
      const f = renderizar(p); expect(f.nativeElement.textContent).toContain('Não informado');
      if (papel !== 'ADMIN') expect(f.nativeElement.textContent).toContain('Não informada');
      expect(f.nativeElement.querySelectorAll('dd').length).toBe(papel === 'ALUNO' ? 7 : papel === 'MOTORISTA' ? 5 : 3);
    });
  }
  for (const papel of ['ALUNO', 'MOTORISTA'] as Papel[]) {
    it(`${papel}: não confunde valor zero com ausência`, () => {
      const p = dados(papel); if (p.pessoa.aluno) p.pessoa.aluno.mensalidade = 0; if (p.pessoa.motorista) p.pessoa.motorista.salario = 0;
      const f = renderizar(p); const valores = [...f.nativeElement.querySelectorAll('dd')] as HTMLElement[];
      expect(valores.at(-1)?.textContent).toContain('0'); expect(valores.at(-1)?.textContent).not.toContain('Não inform');
    });
  }
  it('mantém carregamento até a consulta terminar, sem mostrar cartões incompletos', () => {
    const resposta = new Subject<MeResponse>(); auth.carregarPerfil.and.returnValue(resposta);
    const f = TestBed.createComponent(Perfil); f.detectChanges();
    expect(f.nativeElement.querySelector('p-progressspinner')).not.toBeNull(); expect(f.nativeElement.querySelector('.perfil-identidade')).toBeNull();
    resposta.next(dados('ADMIN')); resposta.complete(); f.detectChanges();
    expect(f.nativeElement.querySelector('p-progressspinner')).toBeNull(); expect(f.nativeElement.querySelector('.perfil-identidade')).not.toBeNull();
  });
  it('preserva o erro de consulta sem exibir dados de outra sessão', () => {
    auth.carregarPerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const f = TestBed.createComponent(Perfil); f.detectChanges();
    expect(f.nativeElement.querySelector('p-message')).not.toBeNull(); expect(f.nativeElement.querySelector('.perfil-identidade')).toBeNull();
  });
  it('mantém nome/e-mail longos como texto seguro com quebra de linha', () => {
    const p = dados('ADMIN'); p.pessoa.nome = '<img src=x onerror=alert(1)>' + 'Nome'.repeat(40); p.email = 'email'.repeat(30) + '@teste.com';
    const f = renderizar(p); const nome = f.nativeElement.querySelector('#perfil-nome') as HTMLElement;
    expect(nome.textContent).toBe(p.pessoa.nome); expect(nome.querySelector('img')).toBeNull();
    expect(getComputedStyle(nome).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(f.nativeElement.querySelector('.perfil-email')).overflowWrap).toBe('anywhere');
  });
  it('compacta os dados do administrador em três colunas e empilha em telas pequenas', () => {
    const f = renderizar(dados('ADMIN')); const host = f.nativeElement as HTMLElement; host.style.width = '960px';
    const lista = host.querySelector('.profile-list')!;
    const campos = [...lista.children] as HTMLElement[];
    expect(campos[0].getBoundingClientRect().top).toBe(campos[2].getBoundingClientRect().top);
    expect(campos[2].getBoundingClientRect().left).toBeGreaterThan(campos[0].getBoundingClientRect().right);
    host.style.width = '320px';
    expect(campos[2].getBoundingClientRect().top).toBeGreaterThan(campos[0].getBoundingClientRect().bottom);
  });
});
