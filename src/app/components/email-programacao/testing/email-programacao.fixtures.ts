import { viagemFixture } from '../../dashboard/testing/dashboard.fixtures';
import { ConfiguracaoEmail, HistoricoEmail, LoteEmail, PreviaEmail } from '../models/email-programacao.models';
import { diaSaoPaulo } from '../utils/email-programacao.utils';
export const EMAIL_ID = '123e4567-e89b-42d3-a456-426614174000';
export const configEmailFixture: ConfiguracaoEmail = { habilitado: true, automatico: false, modoTeste: true, disponivel: true, horario: '15:00', fuso: 'America/Sao_Paulo', impedimentos: [] };
export function previaEmailFixture(): PreviaEmail {
  return { dataReferencia: diaSaoPaulo(), geradoEm: new Date().toISOString(), destinatariosElegiveis: 2, destinatariosIgnorados: 1,
    viagens: [{ ...structuredClone(viagemFixture), dataOcorrencia: diaSaoPaulo() }], avisos: [],
    mensagem: { assunto: 'Programação de hoje', texto: 'Faculdade A\nÔnibus: 01 | Motorista: João', html: '<p>Programação</p>' } };
}
export function loteEmailFixture(): LoteEmail {
  return { id: EMAIL_ID, dataReferencia: diaSaoPaulo(), origem: 'MANUAL', reenvio: false, motivo: null, criadoEm: new Date().toISOString(), ignorados: 1,
    totais: { PENDENTE: 0, PROCESSANDO: 0, ACEITA_SMTP: 1, FALHA: 0, INCERTA: 0, SUPRIMIDA: 0, EXPIRADA: 0 },
    entregas: [{ id: EMAIL_ID, usuarioId: 2, email: 'aluno@example.com', revisao: 0, estado: 'ACEITA_SMTP', tentativas: 1, erro: null, aceitoEm: new Date().toISOString() }],
    mensagem: { assunto: 'Mensagem congelada', texto: 'Ônibus original: 01', html: '<p>Original</p>' } };
}
export const historicoEmailFixture: HistoricoEmail = { pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0, itens: [] };
