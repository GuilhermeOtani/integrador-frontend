import { FormaPagamento } from '../models/conta-receber';
import { FORMAS_PAGAMENTO, idFinanceiroValido, valorFinanceiroValido } from '../../../core/financeiro/financeiro.utils';
export interface IntencaoRecebimento {
  versao: 1; usuarioId: number; contaId: number; formaPagamento: FormaPagamento; valorPago?: number;
  chave: string; estado: 'INCERTA' | 'REGISTRADA';
}
/** Isolado por usuário e por domínio: nunca reutiliza pagamentos de contas a pagar. */
export class RecebimentoPendente {
  readonly chave: string;
  constructor(private readonly usuarioId: number, private readonly storage: () => Storage = () => sessionStorage) {
    this.chave = `integrador.recebimento.pendente.${usuarioId}`;
  }
  salvar(i: IntencaoRecebimento | null): boolean {
    try { if (i) this.storage().setItem(this.chave, JSON.stringify(i)); else this.storage().removeItem(this.chave); return true; } catch { return false; }
  }
  ler(): { tipo: 'ausente' | 'invalida' | 'indisponivel' } | { tipo: 'valida'; intencao: IntencaoRecebimento } {
    let texto: string | null;
    try { texto = this.storage().getItem(this.chave); } catch { return { tipo: 'indisponivel' }; }
    if (!texto) return { tipo: 'ausente' };
    try {
      const i = JSON.parse(texto) as IntencaoRecebimento;
      if (!i || i.versao !== 1 || i.usuarioId !== this.usuarioId || !idFinanceiroValido(this.usuarioId) || !idFinanceiroValido(i.contaId) ||
        !FORMAS_PAGAMENTO.some(f => f.value === i.formaPagamento) || (i.valorPago !== undefined && !valorFinanceiroValido(i.valorPago, true)) ||
        typeof i.chave !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(i.chave) ||
        !['INCERTA', 'REGISTRADA'].includes(i.estado) || Object.keys(i).some(k => !['versao', 'usuarioId', 'contaId', 'formaPagamento', 'valorPago', 'chave', 'estado'].includes(k))) return { tipo: 'invalida' };
      return { tipo: 'valida', intencao: i };
    } catch { return { tipo: 'invalida' }; }
  }
}
