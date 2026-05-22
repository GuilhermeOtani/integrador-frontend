import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PontoEmbarqueCadastro } from './ponto-embarque-cadastro';

describe('PontoEmbarqueCadastro', () => {
  let component: PontoEmbarqueCadastro;
  let fixture: ComponentFixture<PontoEmbarqueCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoEmbarqueCadastro]
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
