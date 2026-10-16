import { avisoFinanceiro, dataFinanceiraValida, diaFinanceiro, emissaoFinanceira, idFinanceiroValido, mesFinanceiroValido, moedaFinanceira, periodoFinanceiroAtual, valorFinanceiroValido } from './financeiro.utils';
describe('Utilitários financeiros', () => {
  it('defaults usam o mês de São Paulo mesmo em virada UTC', () => {
    expect(periodoFinanceiroAtual(new Date('2026-11-01T01:00:00Z'))).toEqual({ mes: '2026-10', inicio: '2026-10-01', fim: '2026-10-31' });
    expect(periodoFinanceiroAtual(new Date('2024-02-10T12:00:00Z')).fim).toBe('2024-02-29');
  });
  it('datas civis não retrocedem e rejeitam dias inexistentes', () => {
    expect(diaFinanceiro('2026-10-01')).toBe('01/10/2026');
    for (const d of ['2026-02-29', '2026-13-01', '0000-01-01', '', '2026-1-01']) expect(dataFinanceiraValida(d)).toBeFalse();
    expect(dataFinanceiraValida('2024-02-29')).toBeTrue(); expect(diaFinanceiro(null)).toBe('Não informado');
  });
  it('competência e ID válidos não aceitam zero ou ano zero', () => {
    expect(mesFinanceiroValido('2026-10')).toBeTrue();
    for (const m of ['0000-10', '2026-13', '2026-1', '2026-10-01']) expect(mesFinanceiroValido(m)).toBeFalse();
    for (const id of [0, -1, 1.1, NaN, '1']) expect(idFinanceiroValido(id)).toBeFalse();
  });
  it('centavos aceitam zero/negativo no saldo mas não no pagamento', () => {
    for (const n of [0, -10.12, 10.01, 0.29]) expect(valorFinanceiroValido(n)).toBeTrue();
    for (const n of [0, -1, 1.001, 0.1 + 0.2, NaN, Infinity, null, 1e16]) expect(valorFinanceiroValido(n, true)).toBeFalse();
  });
  it('formata zero sem confundir com ausência e converte emissão para São Paulo', () => {
    expect(moedaFinanceira(0)).toContain('0,00'); expect(moedaFinanceira(null)).toBe('Não informado');
    expect(emissaoFinanceira('2026-10-17T01:00:00Z')).toContain('16/10/2026');
    expect(emissaoFinanceira('invalido')).toBe('Não informado');
  });
  it('avisos desconhecidos continuam visíveis', () => {
    expect(avisoFinanceiro('QUITACAO_SEM_COMPROVANTE')).toContain('sem comprovante');
    expect(avisoFinanceiro('NOVO_AVISO')).toContain('NOVO_AVISO');
  });
});
