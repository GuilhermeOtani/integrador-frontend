import { EnvioEmailRequest } from '../models/email-programacao.models';
import { dataCivilValida } from './email-programacao.utils';

export interface IntencaoEmail { versao: 1; adminId: number; dataReferencia: string; criadoEm: string; request: EnvioEmailRequest; }
export const uuidEmailValido = (valor: unknown): valor is string => typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
export class SolicitacaoPendente {
  readonly chave: string;
  constructor(private readonly adminId: number, private readonly armazenamento: () => Storage = () => sessionStorage) {
    this.chave = `integrador.email.request.${adminId}`;
  }
  salvar(intencao: IntencaoEmail | null): boolean {
    try {
      if (intencao) this.armazenamento().setItem(this.chave, JSON.stringify(intencao));
      else this.armazenamento().removeItem(this.chave);
      return true;
    } catch { return false; }
  }
  restaurar(): IntencaoEmail | null {
    try {
      const json = this.armazenamento().getItem(this.chave);
      if (!json) return null;
      const i = JSON.parse(json) as IntencaoEmail;
      const r = i?.request;
      if (i?.versao !== 1 || i.adminId !== this.adminId || !Number.isSafeInteger(this.adminId) || this.adminId <= 0 ||
          !dataCivilValida(i.dataReferencia) || typeof i.criadoEm !== 'string' || Number.isNaN(Date.parse(i.criadoEm)) ||
          !r || !uuidEmailValido(r.requestId) || typeof r.reenviar !== 'boolean' ||
          Object.keys(r).some(k => !['requestId', 'reenviar', 'motivo'].includes(k)) ||
          (r.reenviar ? typeof r.motivo !== 'string' || !r.motivo.trim() || r.motivo.length > 500 || r.motivo !== r.motivo.trim() : r.motivo !== undefined)) {
        this.salvar(null); return null;
      }
      return i;
    } catch { this.salvar(null); return null; }
  }
}
