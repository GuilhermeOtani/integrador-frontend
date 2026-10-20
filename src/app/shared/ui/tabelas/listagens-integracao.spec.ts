import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Table } from 'primeng/table';
import { AuthService } from '../../../core/auth/service/auth.service';
import { FaculdadeListar } from '../../../components/faculdade/components/faculdade-listar/faculdade-listar';
import { MotoristaListar } from '../../../components/motorista/components/motorista-listar/motorista-listar';
import { OnibusListar } from '../../../components/onibus/components/onibus-listar/onibus-listar';
import { PontoEmbarqueListar } from '../../../components/ponto-embarque/components/ponto-embarque-listar/ponto-embarque-listar';
import { RotaListar } from '../../../components/rota/components/rota-listar/rota-listar';
import { GradeDiariaListar } from '../../../components/grade-diaria/components/grade-diaria-listar/grade-diaria-listar';
const casos: { nome: string; componente: Type<unknown> }[] = [
  { nome: 'faculdades', componente: FaculdadeListar }, { nome: 'motoristas', componente: MotoristaListar },
  { nome: 'ônibus', componente: OnibusListar }, { nome: 'pontos', componente: PontoEmbarqueListar },
  { nome: 'rotas', componente: RotaListar }, { nome: 'grades', componente: GradeDiariaListar },
];
const exemplo = { id: 3, nome: 'Registro de teste', descricao: 'Exemplo', endereco: 'Rua', diaSemana: 'SEGUNDA', viagens: [],
  numeroIdentificacao: '100', statusOnibus: 'OPERANDO', capacidade: 30, placa: 'EXE1234', modelo: 'Modelo', salario: 1234.56, ordemParada: 1 };
function preparar(componente: Type<unknown>, papel = 'ADMIN') {
  TestBed.configureTestingModule({ imports: [componente], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(),
    { provide: AuthService, useValue: { temPapel: (...papeis: string[]) => papeis.includes(papel) } }] });
  const fixture = TestBed.createComponent(componente); fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  return { fixture, http };
}
describe('Padrão compartilhado nos cadastros reais', () => {
  it('Rotas conserva ordenação, filtro e seleção após retirar a coluna de faculdade',fakeAsync(()=>{
    const {fixture,http}=preparar(RotaListar);
    http.expectOne(r=>r.url.endsWith('/rota/listar')).flush([{...exemplo,id:3,nome:'Zeta'},{...exemplo,id:4,nome:'Alfa'}]);fixture.detectChanges();
    const raiz=fixture.nativeElement as HTMLElement;
    raiz.querySelector<HTMLElement>('th[psortablecolumn="nome"]')!.click();fixture.detectChanges();
    expect(raiz.querySelector('tbody tr')!.textContent).toContain('Alfa');
    const pesquisa=raiz.querySelector<HTMLInputElement>('#pesquisa-rota')!;
    pesquisa.value='Zeta';pesquisa.dispatchEvent(new Event('input'));tick(350);fixture.detectChanges();
    expect(raiz.querySelectorAll('tbody tr').length).toBe(1);expect(raiz.querySelector('tbody')!.textContent).toContain('Zeta');
    raiz.querySelector<HTMLInputElement>('tbody p-tablecheckbox input')!.click();fixture.detectChanges();
    expect((fixture.componentInstance as RotaListar).selectedRotas?.map(r=>r.id)).toEqual([3]);
    http.expectNone(r=>r.method!=='GET');fixture.destroy();http.verify();
  }));
  for (const caso of casos) {
    it(`${caso.nome}: mantém GET, exportação e ações sem texto no painel compartilhado`, () => {
      const { fixture, http } = preparar(caso.componente);
      const pendentes = http.match(() => true); expect(pendentes.length).toBe(1); expect(pendentes[0].request.method).toBe('GET');
      const table = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
      expect(table.loading).toBeTrue(); pendentes[0].flush([exemplo]); fixture.detectChanges();
      expect(table.loading).toBeFalse(); expect(table.value?.length).toBe(1); expect(table.stripedRows).toBeFalse();
      expect(fixture.nativeElement.querySelector('.app-cabecalho h1')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.app-tabela-painel p-table.app-tabela')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.p-datatable-header')).toBeNull();
      const cabecalhos = [...fixture.nativeElement.querySelectorAll('thead th')] as HTMLElement[];
      const celulas = [...fixture.nativeElement.querySelector('tbody tr').children] as HTMLElement[];
      expect(celulas.length).toBe(cabecalhos.length);
      if(caso.nome==='rotas'){
        expect(cabecalhos.every(th=>th.classList.contains('app-col-centro'))).toBeTrue();
        expect(cabecalhos.map(th=>th.textContent).join(' ')).not.toContain('Faculdade Destino');
        expect(table.globalFilterFields).not.toContain('faculdade.nome');
        expect(table.columns?.map((c:{field:string})=>c.field)).toEqual(['id','nome','descricao']);
      }
      if(caso.nome==='grades'){
        expect(cabecalhos.filter(th=>/Id|Dia da Semana|Descrição|Qtd. Viagens/.test(th.textContent??'')).every(th=>th.classList.contains('app-col-centro'))).toBeTrue();
      }
      cabecalhos.forEach((th, indice) => {
        const alinhamento = th.classList.contains('app-col-centro') ? 'center' : 'left';
        expect(th.classList.contains('app-col-centro') || th.classList.contains('app-col-texto')).toBeTrue();
        expect(getComputedStyle(th).textAlign).toBe(alinhamento);
        expect(getComputedStyle(celulas[indice]).textAlign).toBe(alinhamento);
        expect(getComputedStyle(th).display).toBe('table-cell');
        expect(getComputedStyle(celulas[indice]).verticalAlign).toBe('middle');
      });
      for (const c of celulas.filter(c => c.classList.contains('app-dado-compacto'))) {
        expect(getComputedStyle(c).whiteSpace).toBe('nowrap');
      }
      const botoes = fixture.nativeElement.querySelectorAll('tbody app-acao-tabela button') as NodeListOf<HTMLButtonElement>;
      expect(botoes.length).toBeGreaterThan(0);
      for (const b of botoes) { expect(b.getAttribute('aria-label')).toBeTruthy(); expect(b.querySelector('.p-button-label')?.textContent?.trim() ?? '').toBe(''); }
      spyOn(table, 'exportCSV');
      const exportar = [...fixture.nativeElement.querySelectorAll('.app-cabecalho button')] as HTMLButtonElement[];
      exportar.find(b => b.textContent?.includes('Exportar'))!.click(); expect(table.exportCSV).toHaveBeenCalledTimes(1);
      http.expectNone(r => r.method !== 'GET'); fixture.destroy(); http.verify();
    });
  }
  for (const caso of casos.filter(c => ['pontos','rotas','grades'].includes(c.nome))) {
    it(`${caso.nome}: ALUNO continua sem ações administrativas`, () => {
      const { fixture, http } = preparar(caso.componente, 'ALUNO'); http.match(() => true).forEach(r => r.flush([exemplo])); fixture.detectChanges();
      const acoes = [...fixture.nativeElement.querySelectorAll('tbody button')] as HTMLButtonElement[];
      for (const b of acoes) expect(b.getAttribute('aria-label')).toContain('Ver detalhes');
      expect(fixture.nativeElement.querySelector('p-tableCheckbox')).toBeNull();
      const gerais = fixture.nativeElement.querySelector('.app-cabecalho')?.textContent ?? '';
      expect(gerais).not.toContain('Novo'); expect(gerais).not.toContain('Excluir'); fixture.destroy(); http.verify();
    });
  }
});
