import { FormaPagamento } from '../../relatorios/models/relatorios.models';
import { FORMAS_PAGAMENTO, idFinanceiroValido, valorFinanceiroValido } from '../../../core/financeiro/financeiro.utils';
export interface IntencaoPagamento {
  versao: 1; adminId: number; contaId: number; formaPagamento: FormaPagamento; valorPago?: number;
  chave: string; estado: 'INCERTA' | 'REGISTRADA';
}
export type LeituraPagamento = { tipo: 'ausente' } | { tipo: 'valida'; intencao: IntencaoPagamento } | { tipo: 'invalida' | 'indisponivel' };
export class PagamentoPendente {
  readonly chave: string;
  constructor(private readonly adminId: number, private readonly storage: () => Storage = () => sessionStorage) { this.chave = `integrador.pagamento.pendente.${adminId}`; }
  salvar(i: IntencaoPagamento | null): boolean {
    try { if (i) this.storage().setItem(this.chave, JSON.stringify(i)); else this.storage().removeItem(this.chave); return true; } catch { return false; }
  }
  ler(): LeituraPagamento {
    let texto: string | null;
    try { texto = this.storage().getItem(this.chave); } catch { return { tipo: 'indisponivel' }; }
    if (!texto) return { tipo: 'ausente' };
    try {
      const i = JSON.parse(texto) as IntencaoPagamento;
      if (!i || i.versao !== 1 || i.adminId !== this.adminId || !idFinanceiroValido(this.adminId) || !idFinanceiroValido(i.contaId) ||
        !FORMAS_PAGAMENTO.some(f => f.value === i.formaPagamento) || (i.valorPago !== undefined && !valorFinanceiroValido(i.valorPago, true)) ||
        typeof i.chave !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(i.chave) ||
        !['INCERTA', 'REGISTRADA'].includes(i.estado) || Object.keys(i).some(k => !['versao', 'adminId', 'contaId', 'formaPagamento', 'valorPago', 'chave', 'estado'].includes(k))) return { tipo: 'invalida' };
      return { tipo: 'valida', intencao: i };
    } catch { return { tipo: 'invalida' }; }
  }
}
