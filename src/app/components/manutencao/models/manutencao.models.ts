import { Papel } from '../../../core/auth/models/auth.models';

export type PrioridadeChamado = 'BAIXA' | 'MEDIA' | 'ALTA';
export type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
export type StatusOnibus = 'OPERANDO' | 'MANUTENCAO' | 'QUEBRADO' | 'INATIVO';

export interface OnibusChamado {
  id: number;
  numeroIdentificacao: string | null;
  placa: string | null;
  modelo: string | null;
  statusOnibus: StatusOnibus | null;
}

export interface ChamadoManutencao {
  id: number;
  descricao: string;
  dataAbertura: string;
  urgencia: PrioridadeChamado;
  status: StatusChamado;
  observacaoAdmin: string | null;
  onibus: OnibusChamado;
  solicitante: { pessoaId: number; nome: string; tipoPessoa: Papel };
}

export interface AbrirChamado { onibusId: number; descricao: string }
export interface AtenderChamado {
  urgencia: PrioridadeChamado;
  status: StatusChamado;
  observacaoAdmin: string | null;
  statusOnibus?: StatusOnibus;
}
export interface FiltrosChamado {
  status?: StatusChamado;
  urgencia?: PrioridadeChamado;
  onibusId?: number;
}

export const PRIORIDADES: { label: string; value: PrioridadeChamado }[] = [
  { label: 'Baixa', value: 'BAIXA' },
  { label: 'Média', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
];
export const ESTADOS_CHAMADO: { label: string; value: StatusChamado }[] = [
  { label: 'Aberto', value: 'ABERTO' },
  { label: 'Em andamento', value: 'EM_ANDAMENTO' },
  { label: 'Resolvido', value: 'RESOLVIDO' },
];
export const ESTADOS_ONIBUS: { label: string; value: StatusOnibus }[] = [
  { label: 'Operando', value: 'OPERANDO' },
  { label: 'Em manutenção', value: 'MANUTENCAO' },
  { label: 'Quebrado', value: 'QUEBRADO' },
  { label: 'Inativo', value: 'INATIVO' },
];
