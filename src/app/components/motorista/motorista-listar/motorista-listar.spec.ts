import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristaListar } from './motorista-listar';

describe('MotoristaListar', () => {
  let component: MotoristaListar;
  let fixture: ComponentFixture<MotoristaListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristaListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MotoristaListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
