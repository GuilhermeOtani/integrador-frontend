import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnibusCadastro } from './onibus-cadastro';

describe('OnibusCadastro', () => {
  let component: OnibusCadastro;
  let fixture: ComponentFixture<OnibusCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnibusCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnibusCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
