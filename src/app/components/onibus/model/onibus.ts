import motorista from "../../motorista/model/motorista";

export default class onibus {
    id!: number;
    numeroIdentificacao!: string;
    placa!: string;
    modelo!: string;
    statusOnibus!: string; 
    fotoUrl!: string;
    capacidade!: number;
}

export type OnibusId = onibus['id'];