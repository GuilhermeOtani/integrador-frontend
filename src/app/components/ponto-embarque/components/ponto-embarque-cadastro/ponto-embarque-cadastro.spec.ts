import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { PontoEmbarqueCadastro } from './ponto-embarque-cadastro';

describe('PontoEmbarqueCadastro', () => {
  let component: PontoEmbarqueCadastro;
  let fixture: ComponentFixture<PontoEmbarqueCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoEmbarqueCadastro],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PontoEmbarqueCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('alinha descrição e ordem na mesma largura sem grid deslocado',()=>{
    const raiz=fixture.nativeElement as HTMLElement;raiz.style.width='420px';
    const descricao=raiz.querySelector<HTMLInputElement>('#descricao')!.getBoundingClientRect();
    const ordem=raiz.querySelector<HTMLInputElement>('#ordemParada')!.getBoundingClientRect();
    expect(Math.abs(descricao.left-ordem.left)).toBeLessThan(1);
    expect(Math.abs(descricao.width-ordem.width)).toBeLessThan(1);
    expect(raiz.querySelector('.grid')).toBeNull();
  });
  it('mantém as validações e o cancelamento sem salvar',()=>{
    const cancelar=spyOn(component.aoCancelar,'emit');
    component.confirmarSalvar();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A Descrição é obrigatória.');
    expect(fixture.nativeElement.textContent).toContain('A Ordem de Parada é obrigatória.');
    component.cancelar();expect(cancelar).toHaveBeenCalledTimes(1);
  });
});
