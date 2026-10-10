import Faculdade from '../../faculdade/models/faculdade';
import Rota from '../../rota/models/rota';
import Onibus from '../../onibus/models/onibus';
import Motorista from '../../motorista/models/motorista';

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
