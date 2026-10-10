import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { problemaApi } from '../../../core/auth/utils/api-error';
import { ESTADOS_CHAMADO, ESTADOS_ONIBUS, OnibusChamado, PRIORIDADES } from '../models/manutencao.models';

export function textoObrigatorio(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}
export function errosNosControles(form: FormGroup, error: HttpErrorResponse): void {
  if (error.status !== 400) return;
  Object.entries(problemaApi(error)?.errors ?? {}).forEach(([campo, mensagem]) => {
    const controle = form.get(campo);
    controle?.setErrors({ ...controle.errors, servidor: mensagem });
    controle?.markAsTouched();
  });
}
export function idOnibusParametro(valor: string | null): number | null {
  if (!valor || !/^[1-9]\d*$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) ? id : null;
}
export function rotuloOnibus(o: OnibusChamado): string {
  return [o.numeroIdentificacao, o.placa, o.modelo].map(v => v?.trim() || 'Não informado').join(' — ');
}
export function rotuloEstadoOnibus(valor: string | null | undefined): string {
  return ESTADOS_ONIBUS.find(o => o.value === valor)?.label ?? 'Não informado';
}
export function rotuloPrioridade(valor: string): string {
  return PRIORIDADES.find(o => o.value === valor)?.label ?? valor;
}
export function rotuloAndamento(valor: string): string {
  return ESTADOS_CHAMADO.find(o => o.value === valor)?.label ?? valor;
}
export function severidadePrioridade(valor: string): 'success' | 'warn' | 'danger' {
  return valor === 'ALTA' ? 'danger' : valor === 'MEDIA' ? 'warn' : 'success';
}
export function severidadeAndamento(valor: string): 'success' | 'warn' | 'info' {
  return valor === 'RESOLVIDO' ? 'success' : valor === 'EM_ANDAMENTO' ? 'warn' : 'info';
}
export function papelSolicitante(valor: string): string {
  return valor === 'ALUNO' ? 'Aluno' : valor === 'MOTORISTA' ? 'Motorista' : 'Administrador';
}
export const CAMPOS_PESQUISA_CHAMADO = [
  'id', 'descricao', 'solicitante.nome', 'solicitante.tipoPessoa',
  'onibus.numeroIdentificacao', 'onibus.placa', 'onibus.modelo', 'status', 'urgencia',
];
