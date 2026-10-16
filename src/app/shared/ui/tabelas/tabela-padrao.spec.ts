import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Table, TableModule } from 'primeng/table';
import { TabelaPadrao } from './tabela-padrao';

@Component({ standalone: true, imports: [TableModule, TabelaPadrao], template: `
  <p-table appTabelaPadrao [value]="dados" dataKey="id" [paginator]="paginada" [rows]="20"
    [lazy]="lazy" [totalRecords]="120" [first]="40" [rowsPerPageOptions]="[20,50,100]" [(selection)]="selecionados">
    <ng-template #header><tr><th>ID</th></tr></ng-template>
    <ng-template #body let-d><tr><td>{{ d.id }}</td></tr></ng-template>
  </p-table>` })
class ExemploTabela {
  dados = [{ id: 2 }, { id: 1 }]; selecionados = [this.dados[0]]; paginada = true; lazy = true;
}
describe('Padrão das tabelas PrimeNG', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ExemploTabela], providers: [provideNoopAnimations()] }));
  it('uniformiza aparência e paginação sem mudar tamanho, total ou seleção', () => {
    const fixture = TestBed.createComponent(ExemploTabela); fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(table.rowHover).toBeTrue(); expect(table.stripedRows).toBeFalse(); expect(table.showCurrentPageReport).toBeTrue();
    expect(table.currentPageReportTemplate).toBe('Mostrando {first} a {last} de {totalRecords} registros');
    expect(table.rows).toBe(20); expect(table.first).toBe(40); expect(table.totalRecords).toBe(120);
    expect(table.rowsPerPageOptions).toEqual([20,50,100]); expect(table.selection).toEqual([{ id: 2 }]);
    expect(fixture.nativeElement.querySelector('p-table').classList).toContain('app-tabela');
  });
  it('não reordena os dados nem muda lazy loading', () => {
    const fixture = TestBed.createComponent(ExemploTabela); fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(table.value).toEqual([{ id: 2 }, { id: 1 }]); expect(table.lazy).toBeTrue(); expect(table.sortField).toBeUndefined();
  });
  it('tabela de detalhes não ganha paginação', () => {
    const fixture = TestBed.createComponent(ExemploTabela); fixture.componentInstance.paginada = false; fixture.componentInstance.lazy = false; fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;
    expect(table.paginator).toBeFalse(); expect(fixture.nativeElement.querySelector('p-paginator')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });
});
