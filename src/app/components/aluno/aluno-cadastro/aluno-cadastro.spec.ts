import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { AlunoCadastro } from './aluno-cadastro';

describe('AlunoCadastro', () => {
  let component: AlunoCadastro;
  let fixture: ComponentFixture<AlunoCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlunoCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
