import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ViagemResumo } from '../../dashboard/models/dashboard.models';
import { EstadoEntrega } from '../models/email-programacao.models';

export const ESTADOS_EMAIL: { value: EstadoEntrega; label: string; severity: 'secondary' | 'info' | 'success' | 'danger' | 'warn' }[] = [
  { value: 'PENDENTE', label: 'Na fila', severity: 'secondary' },
  { value: 'PROCESSANDO', label: 'Processando', severity: 'info' },
  { value: 'ACEITA_SMTP', label: 'Aceito pelo servidor de e-mail', severity: 'success' },
  { value: 'FALHA', label: 'Falha conhecida', severity: 'danger' },
  { value: 'INCERTA', label: 'Resultado incerto — conferir antes de reenviar', severity: 'warn' },
  { value: 'SUPRIMIDA', label: 'Não enviado: cadastro alterado ou inativo', severity: 'secondary' },
  { value: 'EXPIRADA', label: 'Janela de envio encerrada', severity: 'warn' },
];
export const rotuloEmail = (estado: EstadoEntrega) => ESTADOS_EMAIL.find(e => e.value === estado)?.label ?? 'Estado não informado';
export const severidadeEmail = (estado: EstadoEntrega) => ESTADOS_EMAIL.find(e => e.value === estado)?.severity ?? 'secondary';
export function textoObrigatorio(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}
export function dataCivilValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith('0000')) return false;
  const data = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}
export function diaEmail(valor: string | null | undefined): string {
  return dataCivilValida(valor) ? valor.split('-').reverse().join('/') : 'Não informado';
}
export function diaSaoPaulo(data = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(data);
  return ['year', 'month', 'day'].map(tipo => partes.find(p => p.type === tipo)!.value).join('-');
}
export function instanteEmail(valor: string | null | undefined): string {
  if (!valor || Number.isNaN(new Date(valor).getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
}
export function textoEmail(valor: string | null | undefined): string { return valor?.trim() || 'Não informado'; }
export interface GrupoFaculdade { nome: string; viagens: ViagemResumo[]; }
export function agruparProgramacao(viagens: ViagemResumo[], pesquisa = ''): GrupoFaculdade[] {
  const grupos = new Map<string, GrupoFaculdade>();
  const termo = pesquisa.trim().toLocaleLowerCase('pt-BR');
  for (const viagem of viagens) {
    const destinos = viagem.faculdades.length ? viagem.faculdades.map(f => f.nome?.trim() || 'Faculdade sem nome') : ['Destino não informado'];
    for (const nome of new Set(destinos)) {
      const chave = nome.toLocaleLowerCase('pt-BR');
      const buscavel = [nome, viagem.rota?.nome, viagem.onibus?.numeroIdentificacao, viagem.motorista?.nome].join(' ').toLocaleLowerCase('pt-BR');
      if (termo && !buscavel.includes(termo)) continue;
      const grupo = grupos.get(chave) ?? { nome, viagens: [] };
      grupo.viagens.push(viagem); grupos.set(chave, grupo);
    }
  }
  return [...grupos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
