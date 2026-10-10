import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { PontoEmbarqueCadastro } from './ponto-embarque-cadastro';

describe('PontoEmbarqueCadastro', () => {
  let component: PontoEmbarqueCadastro;
  let fixture: ComponentFixture<PontoEmbarqueCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoEmbarqueCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PontoEmbarqueCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
