import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { OnibusCadastro } from './onibus-cadastro';

describe('OnibusCadastro', () => {
  let component: OnibusCadastro;
  let fixture: ComponentFixture<OnibusCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnibusCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
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
