import { RecebimentoPendente, IntencaoRecebimento } from './recebimento-pendente';
describe('RecebimentoPendente', () => {
  let memoria: Map<string, string>, storage: Storage, store: RecebimentoPendente;
  const intencao: IntencaoRecebimento = { versao: 1, usuarioId: 7, contaId: 42, formaPagamento: 'PIX', valorPago: 100, chave: '1d830a80-aa48-4a89-8525-807ab108bbde', estado: 'INCERTA' };
  beforeEach(() => { memoria = new Map(); storage = { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => { memoria.set(k, v); }, removeItem: k => { memoria.delete(k); } } as Storage; store = new RecebimentoPendente(7, () => storage); });
  it('separa usuários e pagamentos/recebimentos sem gravar relatórios ou credenciais', () => {
    store.salvar(intencao); expect(store.ler()).toEqual({ tipo: 'valida', intencao }); expect(new RecebimentoPendente(8, () => storage).ler()).toEqual({ tipo: 'ausente' });
    expect(store.chave).toBe('integrador.recebimento.pendente.7'); expect(memoria.size).toBe(1);
  });
  it('preserva omissão de valor para clientes compatíveis', () => { const { valorPago, ...semValor } = intencao; store.salvar(semValor); expect(store.ler()).toEqual({ tipo: 'valida', intencao: semValor }); });
  for (const alteracao of [{ usuarioId: 8 }, { valorPago: 0 }, { valorPago: -1 }, { valorPago: 0.001 }, { chave: 'invalida' }, { contaId: -1 }, { token: 'proibido' }, { estado: 'OUTRO' }, { formaPagamento: 'INVALIDA' }]) {
    it(`rejeita intenção inválida ${JSON.stringify(alteracao)}`, () => { memoria.set(store.chave, JSON.stringify({ ...intencao, ...alteracao })); expect(store.ler()).toEqual({ tipo: 'invalida' }); });
  }
  it('falhas de storage não são tratadas como intenção ausente', () => {
    const indisponivel = new RecebimentoPendente(7, () => { throw new Error('bloqueado'); }); expect(indisponivel.ler()).toEqual({ tipo: 'indisponivel' }); expect(indisponivel.salvar(intencao)).toBeFalse();
  });
});
