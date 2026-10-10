export type StatusFinanceiro = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export type FormaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

export interface ContaReceber {
  id: number;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: StatusFinanceiro;
  alunoId: number;
  nomeAluno: string;
}

export interface ReciboMatricula {
  id: number;
  contaId: number;
  valor: number;
  dataRecebimento: string;
  formaPagamento: FormaPagamento;
  nomeAluno: string;
  descricaoConta: string;
}
