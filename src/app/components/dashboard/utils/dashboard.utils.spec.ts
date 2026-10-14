import { alunoFixture } from '../testing/dashboard.fixtures';
import { geradoEm, mesValido, moeda, prazoCobranca } from './dashboard.utils';

describe('dashboard utils', () => {
  it('distingue dinheiro ausente, zero e negativo em reais', () => {
    expect(moeda(null)).toBe('Não informado');
    expect(moeda(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
    expect(moeda(-100)).toContain('100,00'); expect(moeda(-100)).toContain('-');
  });
  it('formata o instante em São Paulo', () => { expect(geradoEm('2026-10-12T15:00:00Z')).toBe('12/10/2026, 12:00'); });
  it('valida mês sem usar o relógio do navegador', () => {
    for (const invalido of ['', '2026-13', '2026-1', '0000-01', '20-10', '2026-00']) expect(mesValido(invalido)).toBeFalse();
    expect(mesValido('2026-10')).toBeTrue();
  });
  it('mostra todas as situações de cobrança sem expiração artificial', () => {
    const conta = alunoFixture.financeiro.cobrancaPrincipal!;
    expect(prazoCobranca(conta)).toBe('Vence hoje');
    expect(prazoCobranca({ ...conta, situacao: 'A_VENCER', diasParaVencimento: 1 })).toBe('Vence em 1 dia');
    expect(prazoCobranca({ ...conta, situacao: 'VENCIDA', diasParaVencimento: -4 })).toBe('Vencida há 4 dias');
    expect(prazoCobranca({ ...conta, situacao: 'PAGO', diasParaVencimento: null })).toBe('Pago');
    expect(prazoCobranca({ ...conta, situacao: 'SEM_VENCIMENTO', diasParaVencimento: null })).toBe('Sem vencimento');
  });
});
