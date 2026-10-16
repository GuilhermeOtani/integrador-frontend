import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AcaoTabela } from './acao-tabela';
import { TabelaPadrao } from './tabela-padrao';

@Component({ standalone: true, imports: [TableModule, TagModule, AcaoTabela, TabelaPadrao], template: `
  <p-table appTabelaPadrao [value]="dados">
    <ng-template #header><tr>
      <th class="app-col-centro" pSortableColumn="id"><span class="app-titulo-coluna">ID <p-sortIcon field="id" /></span></th>
      <th class="app-col-texto">Descrição</th><th class="app-valor app-col-centro">Valor</th>
      <th class="app-col-centro">Status</th><th class="app-col-centro app-col-acoes">Ações</th>
    </tr></ng-template>
    <ng-template #body let-d><tr>
      <td class="app-col-centro">{{ d.id }}</td><td class="app-col-texto">{{ d.nome }}<ul><li>Aviso um</li><li>Aviso dois</li></ul></td>
      <td class="app-valor app-col-centro">{{ d.valor ?? 'Não informado' }}</td>
      <td class="app-col-centro"><p-tag value="Pendente" /><p-tag value="Parcial" /></td>
      <td class="app-col-centro app-col-acoes"><div class="app-acoes-linha">
        <app-acao-tabela icon="pi pi-eye" ariaLabel="Detalhes" />
        @if (d.id === 2) { <app-acao-tabela icon="pi pi-pencil" ariaLabel="Editar" [disabled]="true" /> }
      </div></td>
    </tr></ng-template>
  </p-table>
  <table class="app-tabela-nativa"><thead><tr><th class="app-col-centro" scope="col">Mês</th><th class="app-valor app-col-centro" scope="col">Saldo</th></tr></thead>
    <tbody><tr><th class="app-col-centro" scope="row">2026-10</th><td class="app-valor app-col-centro">R$ 12.345,67</td></tr></tbody></table>
` })
class ExemploAlinhamento {
  dados = [{ id: 2, nome: 'Descrição longa com várias palavras e avisos preservados', valor: 'R$ 12.345,67' },
    { id: 1, nome: 'Nome curto', valor: null }];
}

describe('Alinhamento compartilhado das tabelas', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ExemploAlinhamento], providers: [provideNoopAnimations()] }));
  function renderizar() { const f = TestBed.createComponent(ExemploAlinhamento); f.detectChanges(); return f; }
  it('alinha títulos e dados por tipo, inclusive valores ausentes, badges e múltiplos avisos', () => {
    const f = renderizar(); const tabela = f.nativeElement.querySelector('p-table') as HTMLElement;
    for (const tr of tabela.querySelectorAll('tr')) {
      [...tr.children].forEach((c, i) => {
        expect(getComputedStyle(c).textAlign).toBe(i === 1 ? 'left' : 'center');
        expect(getComputedStyle(c).verticalAlign).toBe('middle');
      });
    }
    expect(tabela.textContent).toContain('Não informado'); expect(tabela.querySelectorAll('tbody li').length).toBe(4);
    expect(tabela.querySelectorAll('tbody p-tag').length).toBe(4);
  });
  it('centraliza ações únicas e múltiplas sem mudar o estado bloqueado', () => {
    const f = renderizar(); const grupos = [...f.nativeElement.querySelectorAll('.app-acoes-linha')] as HTMLElement[];
    expect(grupos.map(g => g.querySelectorAll('button').length)).toEqual([2, 1]);
    for (const g of grupos) expect(getComputedStyle(g).justifyContent).toBe('center');
    expect(f.nativeElement.querySelector('button[aria-label="Editar"]').disabled).toBeTrue();
  });
  it('agrupa título e ícone sem transformar th em flex nem impedir a ordenação', () => {
    const f = renderizar(); const th = f.nativeElement.querySelector('th') as HTMLElement;
    expect(getComputedStyle(th).display).toBe('table-cell');
    expect(getComputedStyle(th.querySelector('.app-titulo-coluna')!).display).toBe('inline-flex');
    th.click(); f.detectChanges();
    const ids = [...f.nativeElement.querySelectorAll('p-table tbody tr td:first-child')] as HTMLElement[];
    expect(ids.map(c => c.textContent?.trim())).toEqual(['1', '2']);
  });
  it('aplica a mesma regra na tabela HTML sem perder a semântica de cabeçalhos', () => {
    const f = renderizar(); const tabela = f.nativeElement.querySelector('.app-tabela-nativa') as HTMLElement;
    for (const c of tabela.querySelectorAll('th,td')) expect(getComputedStyle(c).textAlign).toBe('center');
    expect(tabela.querySelector('tbody th')?.getAttribute('scope')).toBe('row');
  });
});
