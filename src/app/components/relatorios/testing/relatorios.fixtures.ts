import { Acerto, ContaPagarResponse, FluxoCaixa, Inadimplencia, ReciboPagamento, SaldoBase } from '../models/relatorios.models';
export const baseFixture: SaldoBase = { dataReferencia: '2026-10-01', saldo: 2500, versao: 0 };
const referencia = { dataReferencia: '2026-10-16', geradoEm: '2026-10-16T12:00:00-03:00', avisos: [] as string[] };
export function inadimplenciaFixture(): Inadimplencia { return { ...referencia, avisos: [], alunoId: null, vencimentoInicio: null, vencimentoFim: null,
  alunos: [{ alunoId: 7, nome: 'João Álvares', matricula: '2026001', telefone: '(18) 99999-0000', arquivado: true,
    cobrancas: [{ contaId: 31, descricao: 'Mensalidade', vencimento: '2026-10-10', valor: 125.5, diasAtraso: 6,
      competencia: '2026-10', valorRecebido: 0, saldoRestante: 125.5, recebimentoParcial: false, avisos: [] }], total: 125.5 }], quantidadeCobrancas: 1, totalGeral: 125.5 };
}
export function fluxoFixture(): FluxoCaixa { return { ...referencia, avisos: [], dataInicio: '2026-10-01', dataFim: '2026-10-31', saldoBase: { ...baseFixture }, saldoInicial: 2500, totalEntradas: 100, totalSaidas: 600, saldoFinal: 2000,
  movimentos: [{ id: 12, contaId: 31, data: '2026-10-16', tipo: 'ENTRADA', descricao: 'Mensalidade', pessoa: 'João', valor: 100, saldoAcumulado: 2600 },
    { id: 12, contaId: 123, data: '2026-10-16', tipo: 'SAIDA', descricao: 'Salário', pessoa: 'José', valor: 600, saldoAcumulado: 2000 }] }; }
export function acertoFixture(): Acerto { return { ...referencia, avisos: [], mes: '2026-10', motoristaId: null,
  motoristas: [{ motoristaId: 42, nome: 'José da Conceição', totalSalarios: 3000, totalDespesas: 0, totalPrevisto: 3000, totalPago: 600, saldoAPagar: 2400,
    lancamentos: [{ contaId: 123, descricao: 'Salário - José', competencia: '2026-10', vencimento: '2026-11-05', classificacao: 'SALARIO', valor: 3000, valorPago: 600, saldoRestante: 2400, pagamentoParcial: true, avisos: [] }] }], totalPrevisto: 3000, totalPago: 600, saldoAPagar: 2400 }; }
export function contaFixture(): ContaPagarResponse { return { id: 123, descricao: 'Salário - José', valor: 3000, dataVencimento: '2026-11-05', status: 'PENDENTE', motorista: { id: 42, nome: 'José', tipoPessoa: 'MOTORISTA' }, competencia: '2026-10', classificacao: 'SALARIO', valorPago: 600, saldoRestante: 2400, pagamentoParcial: true, avisos: [] }; }
export const reciboFixture: ReciboPagamento = { id: 12, valor: 600, dataPagamento: '2026-10-16', formaPagamento: 'PIX', nomeMotorista: 'José', descricaoConta: 'Salário - José' };
