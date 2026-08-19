import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotaCadastro } from './rota-cadastro';

describe('RotaCadastro', () => {
  let component: RotaCadastro;
  let fixture: ComponentFixture<RotaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaCadastro]
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
