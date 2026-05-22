import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PontoEmbarqueListar } from './ponto-embarque-listar';

describe('PontoEmbarqueListar', () => {
  let component: PontoEmbarqueListar;
  let fixture: ComponentFixture<PontoEmbarqueListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoEmbarqueListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PontoEmbarqueListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
