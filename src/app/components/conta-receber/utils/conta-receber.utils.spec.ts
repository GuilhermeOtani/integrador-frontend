import { cobrancaFixture } from '../testing/receber.fixtures';
import { cobrancaProtegida, posicaoReceberValida, recebimentoPermitido } from './conta-receber.utils';
describe('Posição das contas a receber', () => {
  it('não recalcula saldo usando o valor nominal nem o status', () => {
    expect(recebimentoPermitido(cobrancaFixture({ valor: 300, valorRecebido: 100, saldoRestante: 150, avisos: ['STATUS_DIVERGENTE'] }))).toBeTrue();
  });
  it('protege quitações históricas e recebimentos negativos mesmo sem parcial', () => {
    expect(cobrancaProtegida(cobrancaFixture({ valorRecebido: 0, recebimentoParcial: false, status: 'PAGO', avisos: ['QUITACAO_SEM_COMPROVANTE'] }))).toBeTrue();
    expect(cobrancaProtegida(cobrancaFixture({ valorRecebido: -10, recebimentoParcial: false, avisos: ['RECEBIMENTO_NEGATIVO_LEGADO'] }))).toBeTrue();
  });
  it('posição incompleta bloqueia operações e não é substituída por zeros', () => {
    const antiga = { ...cobrancaFixture(), saldoRestante: undefined! }; expect(posicaoReceberValida(antiga)).toBeFalse();
    expect(recebimentoPermitido(antiga)).toBeFalse(); expect(cobrancaProtegida(antiga)).toBeTrue();
  });
  it('soma zero sem aviso não prova ausência de recibos; exclusão depende da última proteção do backend', () => {
    expect(cobrancaProtegida(cobrancaFixture({ valorRecebido: 0, recebimentoParcial: false, saldoRestante: 300 }))).toBeFalse();
  });
});
