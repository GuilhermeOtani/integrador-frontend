import { CobrancaParaPagamento } from '../models/conta-receber';
import { idFinanceiroValido, valorFinanceiroValido } from '../../../core/financeiro/financeiro.utils';
export const posicaoReceberValida = (c: CobrancaParaPagamento): boolean => !!c && idFinanceiroValido(c.id) &&
  Number.isFinite(c.valorRecebido) && Number.isFinite(c.saldoRestante) && typeof c.recebimentoParcial === 'boolean' &&
  Array.isArray(c.avisos) && c.avisos.every(a => typeof a === 'string');
export const recebimentoPermitido = (c: CobrancaParaPagamento): boolean => posicaoReceberValida(c) &&
  valorFinanceiroValido(c.valor, true) && valorFinanceiroValido(c.saldoRestante, true) && c.valorRecebido >= 0 &&
  !c.avisos.some(a => ['VALOR_INVALIDO', 'QUITACAO_SEM_COMPROVANTE', 'RECEBIMENTO_NEGATIVO_LEGADO', 'RECEBIMENTO_SUPERIOR_A_CONTA'].includes(a));
/** A API não informa a contagem dos recibos ao ADMIN. O servidor protege também históricos cuja soma seja zero. */
export const cobrancaProtegida = (c: CobrancaParaPagamento): boolean => !posicaoReceberValida(c) || c.status === 'PAGO' ||
  c.valorRecebido !== 0 || c.recebimentoParcial || c.avisos.some(a => ['QUITACAO_SEM_COMPROVANTE', 'RECEBIMENTO_NEGATIVO_LEGADO', 'RECEBIMENTO_SUPERIOR_A_CONTA'].includes(a));
