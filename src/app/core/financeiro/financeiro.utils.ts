export const FORMAS_PAGAMENTO = [
  { label: 'PIX', value: 'PIX' }, { label: 'Dinheiro', value: 'DINHEIRO' },
  { label: 'Transferência', value: 'TRANSFERENCIA' }, { label: 'Boleto', value: 'BOLETO' }, { label: 'Cartão', value: 'CARTAO' },
] as const;
export const AVISOS_FINANCEIROS: Record<string, string> = {
  VALOR_INVALIDO: 'Regularizar valor do lançamento', COMPETENCIA_AUSENTE: 'Informar competência',
  VENCIMENTO_AUSENTE: 'Informar vencimento', PAGAMENTO_SUPERIOR_A_CONTA: 'Pagamentos antigos superiores ao valor da conta',
  PAGAMENTO_NEGATIVO_LEGADO: 'Pagamento antigo negativo exige revisão',
  RECEBIMENTO_SUPERIOR_A_CONTA: 'Recebimentos antigos superiores ao valor da cobrança',
  RECEBIMENTO_NEGATIVO_LEGADO: 'Recebimento antigo negativo exige revisão',
  QUITACAO_SEM_COMPROVANTE: 'Conta antiga quitada sem comprovante registrado',
  STATUS_DIVERGENTE: 'Status antigo diverge dos pagamentos registrados',
};
export const avisoFinanceiro = (codigo: string): string => AVISOS_FINANCEIROS[codigo] ?? `Revisar lançamento: ${codigo}`;
export const moedaFinanceira = (valor: number | null | undefined): string => valor == null ? 'Não informado' :
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
export const textoFinanceiro = (valor: string | null | undefined): string => valor?.trim() || 'Não informado';
export const pesquisaFinanceira = (valor: string): string => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
export const idFinanceiroValido = (id: unknown): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
export const mesFinanceiroValido = (mes: string): boolean => /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) && !mes.startsWith('0000');
export function dataFinanceiraValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith('0000')) return false;
  const d = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
export const diaFinanceiro = (valor: string | null | undefined): string => valor && dataFinanceiraValida(valor) ? valor.split('-').reverse().join('/') : 'Não informado';
export function emissaoFinanceira(valor: string): string {
  return Number.isNaN(Date.parse(valor)) ? 'Não informado' : new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(valor));
}
export function periodoFinanceiroAtual(agora = new Date()): { mes: string; inicio: string; fim: string } {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(agora);
  const ano = p.find(v => v.type === 'year')!.value; const mes = p.find(v => v.type === 'month')!.value;
  const ultimo = new Date(Date.UTC(Number(ano), Number(mes), 0)).getUTCDate();
  return { mes: `${ano}-${mes}`, inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${ultimo}` };
}
/** Valida centavos sem somar ou recalcular saldos contábeis. */
export function valorFinanceiroValido(valor: unknown, positivo = false): valor is number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) >= 1e17 || (positivo && valor <= 0)) return false;
  return Number.isSafeInteger(Math.round(valor * 100)) && /^-?\d+(\.\d{1,2})?$/.test(String(valor));
}
