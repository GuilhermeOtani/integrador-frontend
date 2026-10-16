export type StatusFinanceiro = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export type FormaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

export interface ContaReceber extends CobrancaParaPagamento {
  alunoId: number;
  nomeAluno: string | null;
}

/** Campos necessários para pagar tanto uma conta completa quanto o resumo do dashboard. */
export interface CobrancaParaPagamento {
  id: number;
  descricao: string | null;
  valor: number | null;
  dataVencimento: string | null;
  status: StatusFinanceiro | null;
  competencia: string | null;
  valorRecebido: number;
  saldoRestante: number;
  recebimentoParcial: boolean;
  avisos: string[];
}

export interface ReciboMatricula {
  id: number;
  contaId: number;
  valor: number;
  dataRecebimento: string;
  formaPagamento: FormaPagamento | null;
  nomeAluno: string | null;
  descricaoConta: string | null;
}

export interface ContaReceberRequest {
  id?: number; descricao: string; valor: number; dataVencimento: string;
  aluno: { id: number }; competencia: string;
}
