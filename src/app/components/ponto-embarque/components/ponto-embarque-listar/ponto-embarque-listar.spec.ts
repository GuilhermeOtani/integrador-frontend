import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PontoEmbarqueListar } from './ponto-embarque-listar';

describe('PontoEmbarqueListar', () => {
  let component: PontoEmbarqueListar;
  let fixture: ComponentFixture<PontoEmbarqueListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoEmbarqueListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
