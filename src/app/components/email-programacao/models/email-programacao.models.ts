import { ViagemResumo } from '../../dashboard/models/dashboard.models';

export type EstadoEntrega = 'PENDENTE' | 'PROCESSANDO' | 'ACEITA_SMTP' | 'FALHA' | 'INCERTA' | 'SUPRIMIDA' | 'EXPIRADA';
export interface ConteudoEmail { assunto: string; texto: string; html: string; }
export interface ConfiguracaoEmail {
  habilitado: boolean; automatico: boolean; modoTeste: boolean; disponivel: boolean;
  horario: string; fuso: string; impedimentos: string[];
}
export interface PreviaEmail {
  dataReferencia: string; geradoEm: string; destinatariosElegiveis: number;
  destinatariosIgnorados: number; viagens: ViagemResumo[]; avisos: string[]; mensagem: ConteudoEmail;
}
export interface EnvioEmailRequest { requestId: string; reenviar: boolean; motivo?: string; }
export interface EntregaEmail {
  id: string; usuarioId: number; email: string; revisao: number; estado: EstadoEntrega;
  tentativas: number; erro: string | null; aceitoEm: string | null;
}
export interface LoteEmail {
  id: string; dataReferencia: string; origem: 'MANUAL' | 'AUTOMATICA'; reenvio: boolean;
  motivo: string | null; criadoEm: string; ignorados: number; totais: Record<EstadoEntrega, number>;
  entregas: EntregaEmail[]; mensagem: ConteudoEmail | null;
}
export interface HistoricoEmail {
  pagina: number; tamanho: number; totalElementos: number; totalPaginas: number; itens: LoteEmail[];
}
