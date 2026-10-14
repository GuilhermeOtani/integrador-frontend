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

/** Campos necessários para pagar tanto uma conta completa quanto o resumo do dashboard. */
export interface CobrancaParaPagamento {
  id: number;
  descricao: string | null;
  valor: number | null;
  dataVencimento: string | null;
  status: StatusFinanceiro | null;
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
