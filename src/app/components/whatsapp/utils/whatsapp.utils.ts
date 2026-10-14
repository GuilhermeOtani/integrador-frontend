import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { mensagemApi } from '../../../core/auth/utils/api-error';
import { StatusEntrega } from '../models/whatsapp.models';

export const ESTADOS_ENTREGA: StatusEntrega[] = ['PENDENTE', 'PROCESSANDO', 'ACEITA', 'ENVIADA', 'ENTREGUE', 'LIDA', 'FALHA', 'INCERTA', 'SUPRIMIDA', 'EXPIRADA'];
export const EM_PROCESSAMENTO: StatusEntrega[] = ['PENDENTE', 'PROCESSANDO', 'ACEITA', 'ENVIADA'];
export const normalizarNumero = (numero: string): string => numero.replace(/[\s()\-]/g, '');
export const validarNumero = (control: AbstractControl) => /^\+[1-9][0-9]{7,14}$/.test(normalizarNumero(control.value ?? '')) ? null : { numero: true };
export const textoObrigatorio = (control: AbstractControl) => typeof control.value === 'string' && control.value.trim() ? null : { required: true };
export const instanteWhatsapp = (valor: string | null | undefined): string => valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(valor)) : 'Não informado';
export const diaWhatsapp = (valor: string): string => ({ SEGUNDA: 'Segunda-feira', TERCA: 'Terça-feira', QUARTA: 'Quarta-feira', QUINTA: 'Quinta-feira', SEXTA: 'Sexta-feira', SABADO: 'Sábado', DOMINGO: 'Domingo' } as Record<string, string>)[valor] ?? valor;
export const rotuloEntrega = (estado: StatusEntrega): string => ({ PENDENTE: 'Aguardando processamento', PROCESSANDO: 'Preparando/envio em andamento', ACEITA: 'Aceita pela Meta', ENVIADA: 'Enviada', ENTREGUE: 'Entregue', LIDA: 'Leitura confirmada', FALHA: 'Falha conhecida', INCERTA: 'Resultado incerto', SUPRIMIDA: 'Não enviada', EXPIRADA: 'Janela encerrada' })[estado];
export const severidadeEntrega = (estado: StatusEntrega): 'success' | 'danger' | 'warn' | 'info' | 'secondary' => estado === 'FALHA' ? 'danger' : ['INCERTA', 'EXPIRADA'].includes(estado) ? 'warn' : ['ENTREGUE', 'LIDA'].includes(estado) ? 'success' : estado === 'SUPRIMIDA' ? 'secondary' : 'info';
export const impedimentoWhatsapp = (valor: string): string => ({ CONTA_INATIVA: 'Conta de acesso inativa', WHATSAPP_NAO_CONFIRMADO: 'WhatsApp não confirmado', NUMERO_FORA_DA_LISTA_DE_TESTE: 'Número fora da lista de teste', SEM_FACULDADE: 'Faculdade não cadastrada', SEM_PROGRAMACAO: 'Sem programação para o dia' } as Record<string, string>)[valor] ?? valor;
export function associarErrosWhatsapp(form: FormGroup, erro: HttpErrorResponse): void {
  if (erro.status !== 400 || !erro.error?.errors || typeof erro.error.errors !== 'object') return;
  for (const [campo, mensagem] of Object.entries(erro.error.errors)) {
    const controle = form.get(campo);
    if (controle && typeof mensagem === 'string') { controle.setErrors({ ...controle.errors, api: mensagem }); controle.markAsTouched(); }
  }
}
export async function erroWhatsapp(error: HttpErrorResponse): Promise<string> {
  if (!(error.error instanceof Blob)) return error.status === 503 ? error.error?.detail ?? 'Integração indisponível. Confira a configuração da Meta.' : mensagemApi(error);
  try {
    const problema: unknown = JSON.parse(await error.error.text());
    return mensagemApi(new HttpErrorResponse({ status: error.status, error: problema }));
  } catch { return mensagemApi(error); }
}
export function baixarPdfWhatsapp(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'programacao.pdf'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function linkAtivacaoSeguro(valor: string): boolean {
  try { const url = new URL(valor); return url.protocol === 'https:' && url.hostname === 'wa.me' && !url.username && !url.password; } catch { return false; }
}
