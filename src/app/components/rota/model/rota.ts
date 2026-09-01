import faculdade from "../../faculdade/model/faculdade";
import { PontoEmbarque } from "../../ponto-embarque/model/ponto-embarque";

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
