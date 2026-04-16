import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnibusListar } from './onibus-listar';

describe('OnibusListar', () => {
  let component: OnibusListar;
  let fixture: ComponentFixture<OnibusListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnibusListar]
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
