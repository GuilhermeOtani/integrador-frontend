import { viagemFixture } from '../../dashboard/testing/dashboard.fixtures';
import { AssinaturaWhatsapp, ConfiguracaoWhatsapp, HistoricoWhatsapp, LoteWhatsapp, PreviaWhatsapp } from '../models/whatsapp.models';

export const assinaturaFixture: AssinaturaWhatsapp = { numero: null, status: 'NAO_CADASTRADA', consentimentoEm: null, confirmadoEm: null, canceladoEm: null, codigoExpiraEm: null };
export const configuracaoFixture: ConfiguracaoWhatsapp = { integracaoHabilitada: true, modoProducao: false, automatico: false, credenciaisConfiguradas: true, webhookVerificado: true, templateVerificado: true, horario: '15:00', fuso: 'America/Sao_Paulo', recuperacaoAte: '18:00', numeroSistema: '+5511999999999' };
export const previaFixture: PreviaWhatsapp = { usuarioId: 2, nome: 'Ana', elegivel: true, impedimentos: [], programacao: { dataReferencia: '2026-10-12', diaSemana: 'SEGUNDA', papel: 'ALUNO', referencia: 'Faculdade A', viagens: [viagemFixture] } };
export const loteFixture: LoteWhatsapp = { id: '592ac47c-c08c-419e-8bfb-c40f8f75a893', dataReferencia: '2026-10-12', origem: 'MANUAL', publico: 'TODOS', reenvio: false, criadoEm: '2026-10-12T18:00:00Z', motivo: null, ignoradosDuplicidade: 0,
  totais: { PENDENTE: 1, PROCESSANDO: 0, ACEITA: 0, ENVIADA: 0, ENTREGUE: 0, LIDA: 0, FALHA: 0, INCERTA: 0, SUPRIMIDA: 0, EXPIRADA: 0 },
  entregas: [{ id: 'entrega-1', usuarioId: 2, nome: 'Ana', numeroMascarado: '***0001', revisao: 0, status: 'PENDENTE', tentativas: 0, erro: null, atualizadoEm: null }] };
export const historicoFixture: HistoricoWhatsapp = { itens: [loteFixture], pagina: 0, tamanho: 20, total: 1, totalPaginas: 1 };
