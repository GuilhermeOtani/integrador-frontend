import { Component, OnInit } from '@angular/core';
import { ContaPagarService } from './conta-pagar-service';
import { TableModule } from 'primeng/table';
import { PagamentoService } from './pagamento-service';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ContaPagar } from './model/conta-pagar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { Column, ExportColumn } from '../motorista/motorista-listar/motorista-listar';

@Component({
  selector: 'app-conta-pagar',
  templateUrl: './conta-pagar.html',
  styleUrls: ['./conta-pagar.css'],
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    CurrencyPipe,
    DatePipe,
    CommonModule,
    InputIconModule,
    IconFieldModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    FormsModule,
  ],
})
export class ContaPagarComponent implements OnInit {
  contasPendentes: ContaPagar[] = [];
  contasPagas: ContaPagar[] = [];
  mostrarPagas: boolean = false;
  exibirModalPagamento: boolean = false;
  contaSelecionada: ContaPagar | null = null;
  valorInformado: number = 0;
  formaPagamentoSelecionada: string = 'PIX';
  exibirModalRecibo: boolean = false;
  reciboSelecionado: any = null;
  cols!: Column[];
  exportColumns!: ExportColumn[];

  formasPagamento = [
    { label: 'PIX', value: 'PIX' },
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Transferência Bancária', value: 'TRANSFERENCIA' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Cartão', value: 'CARTAO' },
  ];

  constructor(
    private contaPagarService: ContaPagarService,
    private pagamentoService: PagamentoService,
  ) {}

  ngOnInit(): void {
    this.carregarContas();
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'ContaPagar ID' },
      { field: 'motorista', header: 'Motorista' },
      { field: 'descricao', header: 'Descrição' },
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  carregarContas(): void {
    this.contaPagarService.listarTodas().subscribe({
      next: (dados) => {
        this.contasPendentes = dados.filter((c) => c.status !== 'PAGO');
        this.contasPagas = dados.filter((c) => c.status === 'PAGO');
      },
      error: (erro) => {
        console.error('Erro ao buscar as contas a pagar no backend:', erro);
      },
    });
  }
  abrirModalPagamento(conta: ContaPagar): void {
    this.contaSelecionada = conta;
    this.valorInformado = conta.valor;
    this.formaPagamentoSelecionada = 'PIX';
    this.exibirModalPagamento = true;
  }

  fecharModalPagamento(): void {
    this.exibirModalPagamento = false;
    this.contaSelecionada = null;
  }

  confirmarPagamento(): void {
    if (!this.contaSelecionada || !this.contaSelecionada.id) return;

    this.pagamentoService
      .realizarPagamento(
        this.contaSelecionada.id,
        this.formaPagamentoSelecionada,
        this.valorInformado,
      )
      .subscribe({
        next: () => {
          this.fecharModalPagamento();
          this.carregarContas();
        },
        error: (erro) => {
          console.error('Erro ao realizar pagamento:', erro);
          alert('Erro ao processar o pagamento!');
        },
      });
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'ATRASADO') return 'danger';
    return 'warn';
  }

  abrirModalRecibo(conta: ContaPagar): void {
    this.contaSelecionada = conta;

    this.pagamentoService.buscarReciboPorConta(conta.id!).subscribe({
      next: (recibo) => {
        this.reciboSelecionado = recibo;
        this.exibirModalRecibo = true;
      },
      error: (erro) => {
        console.error('Erro ao buscar o recibo:', erro);
        alert('Não foi possível carregar os detalhes do pagamento.');
      },
    });
  }

  fecharModalRecibo(): void {
    this.exibirModalRecibo = false;
    this.contaSelecionada = null;
    this.reciboSelecionado = null;
  }
}
