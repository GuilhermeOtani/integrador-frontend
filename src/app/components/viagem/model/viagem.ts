import Faculdade from '../../faculdade/model/faculdade';
import Rota from '../../rota/model/rota';
import Onibus from '../../onibus/model/onibus';
import Motorista from '../../motorista/model/motorista';

export default class Viagem {
  id!: number;
  data!: string;
  rotaId?: number;
  rotaNome?: string;
  onibusId?: number;
  onibusPlaca?: string;
  numeroIdentificacao?: string;
  motoristaId?: number;
  motoristaNome?: string;
  gradeDiariaId!: number;
  faculdadeIds!: number[];
  faculdades!: Faculdade[];
}

export type ViagemId = Viagem['id'];
