import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotaListar } from './rota-listar';

describe('RotaListar', () => {
  let component: RotaListar;
  let fixture: ComponentFixture<RotaListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RotaListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
