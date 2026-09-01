import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { RotaCadastro } from './rota-cadastro';

describe('RotaCadastro', () => {
  let component: RotaCadastro;
  let fixture: ComponentFixture<RotaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RotaCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
