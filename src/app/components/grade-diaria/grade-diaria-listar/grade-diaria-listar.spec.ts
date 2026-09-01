import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GradeDiariaListar } from './grade-diaria-listar';

describe('GradeDiariaListar', () => {
  let component: GradeDiariaListar;
  let fixture: ComponentFixture<GradeDiariaListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDiariaListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeDiariaListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
