import { IntencaoPagamento, PagamentoPendente } from './pagamento-pendente';
describe('PagamentoPendente', () => {
  let storage: Storage; let pendente: PagamentoPendente;
  const i: IntencaoPagamento = { versao: 1, adminId: 1, contaId: 123, formaPagamento: 'PIX', valorPago: 600, chave: '3d639dfb-0b3c-48a7-8fc5-9571ed38517d', estado: 'INCERTA' };
  beforeEach(() => { const mapa = new Map<string, string>(); storage = { getItem: k => mapa.get(k) ?? null, setItem: (k, v) => { mapa.set(k, v); }, removeItem: k => { mapa.delete(k); }, clear: () => mapa.clear(), key: () => null, length: 0 }; pendente = new PagamentoPendente(1, () => storage); });
  it('preserva parâmetros e omissão de valor após recarga', () => {
    expect(pendente.salvar(i)).toBeTrue(); expect(pendente.ler()).toEqual({ tipo: 'valida', intencao: i });
    const { valorPago, ...semValor } = i; pendente.salvar(semValor); const r = pendente.ler(); expect(r.tipo).toBe('valida'); if (r.tipo === 'valida') expect(r.intencao.valorPago).toBeUndefined();
  });
  it('isola por administrador e não remove dados inválidos silenciosamente', () => {
    pendente.salvar(i); expect(new PagamentoPendente(2, () => storage).ler().tipo).toBe('ausente');
    storage.setItem(pendente.chave, JSON.stringify({ ...i, adminId: 2 })); expect(pendente.ler().tipo).toBe('invalida'); expect(storage.getItem(pendente.chave)).not.toBeNull();
  });
  for (const alteracao of [{ contaId: 0 }, { chave: 'outra' }, { valorPago: -1 }, { valorPago: 0.001 }, { formaPagamento: 'OUTRO' }, { estado: 'OUTRO' }, { extra: true }]) {
    it(`recusa armazenamento inválido ${JSON.stringify(alteracao)}`, () => { storage.setItem(pendente.chave, JSON.stringify({ ...i, ...alteracao })); expect(pendente.ler().tipo).toBe('invalida'); });
  }
  it('falha de armazenamento é explícita e não autoriza pagamento', () => {
    const bloqueado = new PagamentoPendente(1, () => { throw new Error('bloqueado'); }); expect(bloqueado.ler().tipo).toBe('indisponivel'); expect(bloqueado.salvar(i)).toBeFalse(); expect(bloqueado.salvar(null)).toBeFalse();
  });
});
