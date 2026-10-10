import motorista from "../../motorista/models/motorista";

export interface ContaPagar {
  id?: number;
  descricao: string;
  valor: number;
  dataVencimento: string; 
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  motorista?: motorista;
}
