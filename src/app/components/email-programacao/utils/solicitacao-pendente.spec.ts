import { EMAIL_ID } from '../testing/email-programacao.fixtures';
import { IntencaoEmail, SolicitacaoPendente } from './solicitacao-pendente';
describe('SolicitacaoPendente', () => {
  let storage: Storage; let pendencia: SolicitacaoPendente;
  const i: IntencaoEmail = { versao: 1, adminId: 1, dataReferencia: '2026-10-14', criadoEm: '2026-10-14T12:00:00Z', request: { requestId: EMAIL_ID, reenviar: true, motivo: 'Alteração' } };
  beforeEach(() => { const dados = new Map<string, string>(); storage = { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => { dados.set(k, v); }, removeItem: (k: string) => { dados.delete(k); } } as Storage; pendencia = new SolicitacaoPendente(1, () => storage); });
  it('restaura exatamente UUID e corpo', () => { expect(pendencia.salvar(i)).toBeTrue(); expect(pendencia.restaurar()).toEqual(i); });
  it('isola solicitações por administrador', () => { pendencia.salvar(i); expect(new SolicitacaoPendente(2, () => storage).restaurar()).toBeNull(); });
  it('limpa ao resolver', () => { pendencia.salvar(i); pendencia.salvar(null); expect(pendencia.restaurar()).toBeNull(); });
  it('JSON inválido não quebra a restauração', () => { storage.setItem(pendencia.chave, '{'); expect(pendencia.restaurar()).toBeNull(); expect(storage.getItem(pendencia.chave)).toBeNull(); });
  for (const [nome, valor] of [
    ['outro admin', { ...i, adminId: 2 }], ['data inválida', { ...i, dataReferencia: '2026-02-30' }], ['versão antiga', { ...i, versao: 0 }],
    ['UUID inválido', { ...i, request: { ...i.request, requestId: 'xx' } }], ['motivo vazio', { ...i, request: { ...i.request, motivo: '  ' } }],
    ['motivo longo', { ...i, request: { ...i.request, motivo: 'x'.repeat(501) } }], ['campo extra', { ...i, request: { ...i.request, usuarioId: 3 } }],
    ['motivo no envio normal', { ...i, request: { ...i.request, reenviar: false } }],
  ] as [string, unknown][]) it(`rejeita ${nome}`, () => { storage.setItem(pendencia.chave, JSON.stringify(valor)); expect(pendencia.restaurar()).toBeNull(); });
  it('aceita envio normal sem motivo e não guarda credencial', () => { const normal = { ...i, request: { requestId: EMAIL_ID, reenviar: false } }; pendencia.salvar(normal); expect(pendencia.restaurar()).toEqual(normal); expect(storage.getItem(pendencia.chave)).not.toContain('accessToken'); });
  it('storage indisponível retorna falha sem lançar exceção', () => { const bloqueado = new SolicitacaoPendente(1, () => { throw new Error('Bloqueado'); }); expect(bloqueado.salvar(i)).toBeFalse(); expect(bloqueado.restaurar()).toBeNull(); });
});
