import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { GradeDiariaCadastro } from './grade-diaria-cadastro';

describe('GradeDiariaCadastro', () => {
  let component: GradeDiariaCadastro;
  let fixture: ComponentFixture<GradeDiariaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDiariaCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeDiariaCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
