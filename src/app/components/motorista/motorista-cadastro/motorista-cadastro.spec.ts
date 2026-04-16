import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristaCadastro } from './motorista-cadastro';

describe('MotoristaCadastro', () => {
  let component: MotoristaCadastro;
  let fixture: ComponentFixture<MotoristaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristaCadastro]
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
