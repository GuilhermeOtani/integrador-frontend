import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { FaculdadeCadastro } from './faculdade-cadastro';

describe('FaculdadeCadastro', () => {
  let component: FaculdadeCadastro;
  let fixture: ComponentFixture<FaculdadeCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaculdadeCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaculdadeCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
