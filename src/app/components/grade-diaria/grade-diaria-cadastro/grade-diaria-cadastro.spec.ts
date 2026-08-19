import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeDiariaCadastro } from './grade-diaria-cadastro';

describe('GradeDiariaCadastro', () => {
  let component: GradeDiariaCadastro;
  let fixture: ComponentFixture<GradeDiariaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDiariaCadastro]
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
