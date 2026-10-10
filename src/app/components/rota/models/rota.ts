import faculdade from "../../faculdade/models/faculdade";
import { PontoEmbarque } from "../../ponto-embarque/models/ponto-embarque";

export default class rota {
  id!: number;
  nome!: string;
  descricao!: string;
  faculdadeId!: number;
  faculdade!: faculdade | null;
  pontosEmbarqueId!: number[];         
  pontosEmbarque!: PontoEmbarque[];
}

export type RotaId = rota['id'];
