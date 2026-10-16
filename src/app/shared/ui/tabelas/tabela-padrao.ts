import { Directive, inject, OnInit } from '@angular/core';
import { Table } from 'primeng/table';

/** Somente apresentação: não interfere em dados, ordem, seleção, lazy loading ou tamanho de página. */
@Directive({ selector: 'p-table[appTabelaPadrao]', standalone: true, host: { class: 'app-tabela' } })
export class TabelaPadrao implements OnInit {
  private readonly tabela = inject(Table, { self: true });
  ngOnInit(): void {
    this.tabela.stripedRows = false;
    this.tabela.rowHover = true;
    if (this.tabela.paginator) {
      this.tabela.showCurrentPageReport = true;
      this.tabela.currentPageReportTemplate = 'Mostrando {first} a {last} de {totalRecords} registros';
    }
  }
}
