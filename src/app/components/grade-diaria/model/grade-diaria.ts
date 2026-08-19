import Viagem from '../../viagem/model/viagem'; 

export default class GradeDiaria {
  id!: number;
  data!: string;
  diaSemana!: string;
  descricao!: string;
  viagens!: Viagem[];
}

export type GradeDiariaId = GradeDiaria['id'];