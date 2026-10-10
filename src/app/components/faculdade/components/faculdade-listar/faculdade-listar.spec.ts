import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FaculdadeListar } from './faculdade-listar';

describe('FaculdadeListar', () => {
  let component: FaculdadeListar;
  let fixture: ComponentFixture<FaculdadeListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaculdadeListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaculdadeListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
