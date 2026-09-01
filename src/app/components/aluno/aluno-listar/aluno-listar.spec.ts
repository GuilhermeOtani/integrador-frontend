import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AlunoListar } from './aluno-listar';

describe('AlunoListar', () => {
  let component: AlunoListar;
  let fixture: ComponentFixture<AlunoListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlunoListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
