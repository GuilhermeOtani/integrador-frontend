import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaculdadeCadastro } from './faculdade-cadastro';

describe('FaculdadeCadastro', () => {
  let component: FaculdadeCadastro;
  let fixture: ComponentFixture<FaculdadeCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaculdadeCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaculdadeCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
