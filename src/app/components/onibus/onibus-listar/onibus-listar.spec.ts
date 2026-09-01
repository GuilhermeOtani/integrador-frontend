import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OnibusListar } from './onibus-listar';

describe('OnibusListar', () => {
  let component: OnibusListar;
  let fixture: ComponentFixture<OnibusListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnibusListar],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnibusListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
