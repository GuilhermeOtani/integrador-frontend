import { HttpErrorResponse } from '@angular/common/http';
import { mensagemApi } from '../../../core/auth/utils/api-error';
import { SituacaoExclusaoAluno, VinculosAluno } from '../models/aluno';

export const TIPOS_VINCULOS_ALUNO: ReadonlyArray<{ chave: keyof VinculosAluno; label: string }> = [
  { chave: 'contasReceber', label: 'Contas a receber' },
  { chave: 'contasPagar', label: 'Contas a pagar' },
  { chave: 'chamados', label: 'Chamados de manutenção' },
  { chave: 'viagens', label: 'Viagens' },
];

export function vinculosValidos(valor: unknown): valor is VinculosAluno {
  if (!valor || typeof valor !== 'object') return false;
  const dados = valor as Record<string, unknown>;
  return TIPOS_VINCULOS_ALUNO.every(({ chave }) => {
    const quantidade = dados[chave];
    return typeof quantidade === 'number' && Number.isSafeInteger(quantidade) && quantidade >= 0;
  });
}

// Falhar de forma fechada: uma resposta incompleta nunca libera uma exclusão definitiva.
export function situacaoExclusaoValida(valor: unknown, alunoId: number): valor is SituacaoExclusaoAluno {
  if (!valor || typeof valor !== 'object') return false;
  const dados = valor as SituacaoExclusaoAluno;
  if (dados.alunoId !== alunoId || typeof dados.arquivado !== 'boolean'
      || typeof dados.podeExcluir !== 'boolean' || typeof dados.possuiAcesso !== 'boolean'
      || !vinculosValidos(dados.vinculos) || !Array.isArray(dados.impedimentos)) return false;
  if (!dados.impedimentos.every(item => item && typeof item.codigo === 'string'
      && typeof item.mensagem === 'string')) return false;
  const elegivel = dados.arquivado && dados.impedimentos.length === 0
    && TIPOS_VINCULOS_ALUNO.every(({ chave }) => dados.vinculos[chave] === 0);
  return !dados.podeExcluir || elegivel;
}

export function mensagemArquivamentoAluno(error: HttpErrorResponse): string {
  if ([404, 405, 501].includes(error.status)) {
    return error.error?.detail ?? 'Aluno ou recurso não encontrado. Atualize a lista e confira se o backend implementou o guia de arquivamento.';
  }
  return mensagemApi(error);
}

export function requerRevisaoAluno(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status === 408 || error.status >= 500;
}
