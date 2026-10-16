import { CobrancaResumo, SituacaoCobranca } from '../models/dashboard.models';
export const moeda = (valor: number | null | undefined): string => valor == null ? 'Não informado' :
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
export const geradoEm = (valor: string): string => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
}).format(new Date(valor));
export const mesValido = (valor: string): boolean => /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(valor) && !valor.startsWith('0000');
export const rotuloSituacao = (situacao: SituacaoCobranca): string => ({
  PAGO: 'Pago', VENCIDA: 'Vencida', VENCE_HOJE: 'Vence hoje', A_VENCER: 'A vencer', SEM_VENCIMENTO: 'Sem vencimento',
})[situacao];
export const severidadeSituacao = (situacao: SituacaoCobranca): 'success' | 'danger' | 'warn' | 'info' => situacao === 'PAGO' ? 'success' : situacao === 'VENCIDA' ? 'danger' : situacao === 'A_VENCER' ? 'info' : 'warn';
export function prazoCobranca(conta: CobrancaResumo): string {
  const dias = conta.diasParaVencimento;
  if (conta.situacao === 'PAGO' || conta.situacao === 'SEM_VENCIMENTO' || conta.situacao === 'VENCE_HOJE' || dias === null) {
    return rotuloSituacao(conta.situacao);
  }
  const quantidade = Math.abs(dias);
  return `${conta.situacao === 'VENCIDA' ? 'Vencida há' : 'Vence em'} ${quantidade} ${quantidade === 1 ? 'dia' : 'dias'}`;
}
