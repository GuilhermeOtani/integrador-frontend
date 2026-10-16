import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ContaReceber, ReciboMatricula } from '../models/conta-receber';
import { MeResponse, UsuarioResumo } from '../../../core/auth/models/auth.models';
export const cobrancaFixture = (dados: Partial<ContaReceber> = {}): ContaReceber => ({
  id: 42, alunoId: 10, nomeAluno: 'Ana', descricao: 'Mensalidade', valor: 300, competencia: '2026-10',
  dataVencimento: '2026-11-05', status: 'PENDENTE', valorRecebido: 100, saldoRestante: 200, recebimentoParcial: true, avisos: [], ...dados,
});
export const reciboFixture = (dados: Partial<ReciboMatricula> = {}): ReciboMatricula => ({
  id: 51, contaId: 42, valor: 100, dataRecebimento: '2026-10-16', formaPagamento: 'PIX', nomeAluno: 'Ana', descricaoConta: 'Mensalidade', ...dados,
});
export function authReceberFixture() {
  return { usuario: signal<UsuarioResumo | null>({ id: 7, pessoaId: 10, tipoPessoa: 'ALUNO', nome: 'Ana', email: 'ana@example.test', ativo: true }),
    carregarPerfil: () => of({ id: 7 } as MeResponse) };
}
