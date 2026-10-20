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

  it('alinha nome e endereço com a mesma largura, sem grid com margens negativas',()=>{
    const raiz=fixture.nativeElement as HTMLElement;raiz.style.width='420px';
    const nome=raiz.querySelector<HTMLInputElement>('#nome')!.getBoundingClientRect();
    const endereco=raiz.querySelector<HTMLInputElement>('#endereco')!.getBoundingClientRect();
    expect(Math.abs(nome.left-endereco.left)).toBeLessThan(1);
    expect(Math.abs(nome.width-endereco.width)).toBeLessThan(1);
    expect(raiz.querySelector('.grid')).toBeNull();
  });
  it('mantém validação do nome e ação de cancelar sem gravar',()=>{
    const cancelar=spyOn(component.aoCancelar,'emit');
    component.confirmarSalvar();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('O Nome é obrigatório.');
    component.cancelar();expect(cancelar).toHaveBeenCalledTimes(1);
  });
});
