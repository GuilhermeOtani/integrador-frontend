import Viagem from '../../viagem/models/viagem'; 

export default class GradeDiaria {
  id!: number;
  data!: string;
  diaSemana!: string;
  descricao!: string;
  viagens!: Viagem[];
}

export type GradeDiariaId = GradeDiaria['id'];