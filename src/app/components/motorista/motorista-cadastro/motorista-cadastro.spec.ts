import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { MotoristaCadastro } from './motorista-cadastro';

describe('MotoristaCadastro', () => {
  let component: MotoristaCadastro;
  let fixture: ComponentFixture<MotoristaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristaCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MotoristaCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
