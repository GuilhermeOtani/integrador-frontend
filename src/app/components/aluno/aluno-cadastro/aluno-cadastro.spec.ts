import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlunoCadastro } from './aluno-cadastro';

describe('AlunoCadastro', () => {
  let component: AlunoCadastro;
  let fixture: ComponentFixture<AlunoCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoCadastro]
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
