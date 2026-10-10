import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';

import { AlunoCadastro } from './aluno-cadastro';

describe('AlunoCadastro', () => {
  let component: AlunoCadastro;
  let fixture: ComponentFixture<AlunoCadastro>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlunoCadastro);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('não envia aluno com mensalidade inválida', () => {
    component.aluno = { nome: 'Aluno', matricula: '2026-1', mensalidade: 0 };

    component.confirmarSalvar();

    http.expectNone(`${environment.apiUrl}/aluno/salvar-aluno`);
    expect(component.submitted).toBeTrue();
  });

  it('envia a mensalidade normalizada ao cadastrar', () => {
    component.aluno = { nome: ' Aluno ', matricula: ' 2026-1 ', mensalidade: 250.456 };

    component.confirmarSalvar();

    const request = http.expectOne(`${environment.apiUrl}/aluno/salvar-aluno`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.nome).toBe('Aluno');
    expect(request.request.body.matricula).toBe('2026-1');
    expect(request.request.body.mensalidade).toBe(250.46);
    request.flush({});
  });
});
