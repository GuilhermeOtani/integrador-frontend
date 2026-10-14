import { ViagemResumo } from '../../dashboard/models/dashboard.models';

export type StatusAssinatura = 'NAO_CADASTRADA' | 'PENDENTE' | 'ATIVA' | 'CANCELADA';
export type PublicoWhatsapp = 'TODOS' | 'ALUNOS' | 'MOTORISTAS';
export type OrigemWhatsapp = 'MANUAL' | 'AUTOMATICA';
export type StatusEntrega = 'PENDENTE' | 'PROCESSANDO' | 'ACEITA' | 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'FALHA' | 'INCERTA' | 'SUPRIMIDA' | 'EXPIRADA';
export interface AssinaturaWhatsapp {
  numero: string | null; status: StatusAssinatura;
  consentimentoEm: string | null; confirmadoEm: string | null; canceladoEm: string | null; codigoExpiraEm: string | null;
}
export interface AtivacaoWhatsapp { assinatura: AssinaturaWhatsapp; linkAtivacao: string; }
export interface ConfiguracaoWhatsapp {
  integracaoHabilitada: boolean; modoProducao: boolean; automatico: boolean;
  credenciaisConfiguradas: boolean; webhookVerificado: boolean; templateVerificado: boolean;
  horario: string; fuso: string; recuperacaoAte: string; numeroSistema: string | null;
}
export interface ProgramacaoWhatsapp {
  dataReferencia: string; diaSemana: string; papel: 'ALUNO' | 'MOTORISTA'; referencia: string; viagens: ViagemResumo[];
}
export interface PreviaWhatsapp { usuarioId: number; nome: string | null; elegivel: boolean; impedimentos: string[]; programacao: ProgramacaoWhatsapp; }
export interface SolicitarEnvioWhatsapp { requestId: string; publico: PublicoWhatsapp; reenviar: boolean; motivo: string | null; }
export interface EntregaWhatsapp {
  id: string; usuarioId: number; nome: string; numeroMascarado: string; revisao: number;
  status: StatusEntrega; tentativas: number; erro: string | null; atualizadoEm: string | null;
}
export interface LoteResumoWhatsapp {
  id: string; dataReferencia: string; origem: OrigemWhatsapp; publico: PublicoWhatsapp; reenvio: boolean; criadoEm: string;
}
export interface LoteWhatsapp extends LoteResumoWhatsapp {
  motivo: string | null; ignoradosDuplicidade: number; totais: Record<StatusEntrega, number>; entregas: EntregaWhatsapp[];
}
export interface HistoricoWhatsapp { itens: LoteResumoWhatsapp[]; pagina: number; tamanho: number; total: number; totalPaginas: number; }
