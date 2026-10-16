export type TipoRelatorio = 'inadimplencia' | 'fluxo-caixa' | 'acerto-motoristas';
export type StatusFinanceiro = 'PENDENTE' | 'PAGO' | 'ATRASADO';
export type ClassificacaoConta = 'SALARIO' | 'DESPESA';
export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'BOLETO' | 'TRANSFERENCIA';
export interface ReferenciaRelatorio { dataReferencia: string; geradoEm: string; avisos: string[]; }
export interface CobrancaRelatorio { contaId: number; descricao: string | null; vencimento: string; valor: number | null; diasAtraso: number;
  competencia: string | null; valorRecebido: number; saldoRestante: number; recebimentoParcial: boolean; avisos: string[]; }
export interface AlunoInadimplente {
  alunoId: number; nome: string | null; matricula: string | null; telefone: string | null;
  arquivado: boolean; cobrancas: CobrancaRelatorio[]; total: number;
}
export interface Inadimplencia extends ReferenciaRelatorio {
  alunoId: number | null; vencimentoInicio: string | null; vencimentoFim: string | null;
  alunos: AlunoInadimplente[]; quantidadeCobrancas: number; totalGeral: number;
}
export interface SaldoBase { dataReferencia: string; saldo: number; versao: number; }
export interface SaldoBaseRequest { dataReferencia: string; saldo: number; versao: number | null; }
export interface MovimentoCaixa {
  id: number; contaId: number | null; data: string; tipo: 'ENTRADA' | 'SAIDA';
  descricao: string | null; pessoa: string | null; valor: number; saldoAcumulado: number;
}
export interface FluxoCaixa extends ReferenciaRelatorio {
  dataInicio: string; dataFim: string; saldoBase: SaldoBase; saldoInicial: number;
  totalEntradas: number; totalSaidas: number; saldoFinal: number; movimentos: MovimentoCaixa[];
}
export interface LancamentoAcerto {
  contaId: number; descricao: string | null; competencia: string; vencimento: string | null;
  classificacao: ClassificacaoConta; valor: number | null; valorPago: number;
  saldoRestante: number; pagamentoParcial: boolean; avisos: string[];
}
export interface AcertoMotorista {
  motoristaId: number; nome: string | null; lancamentos: LancamentoAcerto[];
  totalSalarios: number; totalDespesas: number; totalPrevisto: number; totalPago: number; saldoAPagar: number;
}
export interface Acerto extends ReferenciaRelatorio {
  mes: string; motoristaId: number | null; motoristas: AcertoMotorista[];
  totalPrevisto: number; totalPago: number; saldoAPagar: number;
}
export interface FiltroInadimplencia { alunoId?: number; vencimentoInicio?: string; vencimentoFim?: string; }
export interface FiltroFluxo { dataInicio: string; dataFim: string; }
export interface FiltroAcerto { mes: string; motoristaId?: number; }
export interface PessoaConta { id: number; nome: string | null; tipoPessoa: 'ADMIN' | 'ALUNO' | 'MOTORISTA' | null; }
export interface ContaPagarResponse {
  id: number; descricao: string | null; valor: number | null; dataVencimento: string | null;
  status: StatusFinanceiro | null; motorista: PessoaConta | null; competencia: string | null;
  classificacao: ClassificacaoConta | null; valorPago: number; saldoRestante: number;
  pagamentoParcial: boolean; avisos: string[];
}
export interface ContaPagarRequest {
  id?: number; descricao: string; valor: number; dataVencimento: string;
  motorista: { id: number } | null; competencia: string; classificacao: ClassificacaoConta;
}
export interface ReciboPagamento {
  id: number; valor: number; dataPagamento: string; formaPagamento: FormaPagamento | null;
  nomeMotorista: string | null; descricaoConta: string | null;
}
export interface PagamentoResponse {
  id: number; valor: number; dataPagamento: string; formaPagamento: FormaPagamento;
  contaPagar: { id: number };
}
