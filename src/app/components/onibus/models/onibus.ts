
import { StatusOnibus } from '../../manutencao/models/manutencao.models';

export default class onibus {
    id!: number;
    numeroIdentificacao!: string;
    placa!: string;
    modelo!: string;
    statusOnibus!: StatusOnibus | null;
    fotoUrl!: string;
    capacidade!: number;
}

export type OnibusId = onibus['id'];
