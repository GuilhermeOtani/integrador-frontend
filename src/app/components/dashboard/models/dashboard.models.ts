import { StatusMatricula } from '../../../core/auth/models/auth.models';
import { CobrancaParaPagamento, StatusFinanceiro } from '../../conta-receber/models/conta-receber';
import { PrioridadeChamado, StatusChamado, StatusOnibus } from '../../manutencao/models/manutencao.models';
export type DiaSemana = 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA';
export type SituacaoCobranca = 'PAGO' | 'VENCIDA' | 'VENCE_HOJE' | 'A_VENCER' | 'SEM_VENCIMENTO';
export interface ReferenciaDashboard {
  dataReferencia: string;
  geradoEm: string;
}
export interface AlunoResumo {
  pessoaId: number;
  nome: string | null;
  matricula: string | null;
  statusMatricula: StatusMatricula | null;
}
export interface PessoaResumo {
  pessoaId: number;
  nome: string | null;
}
export interface FaculdadeResumo {
  id: number;
  nome: string | null;
  endereco: string | null;
}
export interface PontoResumo {
  id: number;
  descricao: string | null;
  ordemParada: number | null;
}
export interface RotaResumo {
  id: number;
  nome: string | null;
  descricao: string | null;
  pontosEmbarque: PontoResumo[];
}
export interface GradeResumo {
  id: number;
  diaSemana: DiaSemana | null;
  descricao: string | null;
}
export interface OnibusResumo {
  id: number;
  numeroIdentificacao: string | null;
  placa: string | null;
  modelo: string | null;
  capacidade: number | null;
  statusOnibus: StatusOnibus | null;
}
export interface ViagemResumo {
  id: number;
  grade: GradeResumo | null;
  dataOcorrencia: string | null;
  rota: RotaResumo | null;
  onibus: OnibusResumo | null;
  motorista: PessoaResumo | null;
  faculdades: FaculdadeResumo[];
  onibusDisponivel: boolean;
  avisos: string[];
}
export interface TransporteResumo {
  viagensHoje: ViagemResumo[];
  agendaSemanal: ViagemResumo[];
  programacaoSemGrade: ViagemResumo[];
  rotas: RotaResumo[];
}
export interface CobrancaResumo extends CobrancaParaPagamento {
  id: number;
  descricao: string | null;
  valor: number | null;
  dataVencimento: string | null;
  status: StatusFinanceiro | null;
  situacao: SituacaoCobranca;
  diasParaVencimento: number | null;
}
export interface TotalFinanceiro {
  quantidade: number;
  valor: number;
}
export interface FinanceiroAluno {
  mensalidadeCadastro: number | null;
  cobrancaPrincipal: CobrancaResumo | null;
  emAberto: TotalFinanceiro;
  vencidas: TotalFinanceiro;
}
export interface AlunoDashboard extends ReferenciaDashboard {
  aluno: AlunoResumo;
  faculdade: FaculdadeResumo | null;
  transporte: TransporteResumo;
  financeiro: FinanceiroAluno;
  avisos: string[];
}
export interface MotoristaDashboard extends ReferenciaDashboard {
  motorista: PessoaResumo;
  transporte: TransporteResumo;
  avisos: string[];
}
export interface ResumoContas {
  emAberto: TotalFinanceiro;
  vencidas: TotalFinanceiro;
  vencemEmSeteDias: TotalFinanceiro;
}
export interface MovimentoMensal {
  mes: string;
  recebido: number;
  pago: number;
  saldoMovimentacoes: number;
}
export interface PendenciaFinanceira {
  id: number;
  descricao: string | null;
  valor: number | null;
  dataVencimento: string | null;
  status: StatusFinanceiro | null;
  situacao: SituacaoCobranca;
  nomePessoa: string | null;
}
export interface FinanceiroAdmin {
  recebidoNoMes: number;
  pagoNoMes: number;
  saldoMovimentacoes: number;
  contasReceber: ResumoContas;
  contasPagar: ResumoContas;
  serieMensal: MovimentoMensal[];
  pendenciasReceber: PendenciaFinanceira[];
  pendenciasPagar: PendenciaFinanceira[];
}
export interface AlunosIndicadores {
  total: number;
  ativos: number;
  inativos: number;
  pendentes: number;
  semStatus: number;
}
export interface OnibusIndicadores {
  total: number;
  operando: number;
  manutencao: number;
  quebrado: number;
  inativo: number;
  semStatus: number;
}
export interface ChamadosIndicadores {
  abertos: number;
  emAndamento: number;
  prioridadeAlta: number;
}
export interface ChamadoPendente {
  id: number;
  descricao: string;
  dataAbertura: string;
  urgencia: PrioridadeChamado;
  status: StatusChamado;
  onibusId: number;
  numeroIdentificacao: string | null;
  placa: string | null;
  solicitanteNome: string | null;
}
export interface OperacaoResumo {
  alunos: AlunosIndicadores;
  onibus: OnibusIndicadores;
  viagensHoje: number;
  viagensSemProgramacao: number;
  chamados: ChamadosIndicadores;
  chamadosPendentes: ChamadoPendente[];
}
export interface AdminDashboard extends ReferenciaDashboard {
  mes: string;
  financeiro: FinanceiroAdmin;
  operacao: OperacaoResumo;
}
