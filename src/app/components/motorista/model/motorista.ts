import onibus from '../../onibus/model/onibus';

export default class motorista {
  id!: number;
  nome!: string;
  email!: string;
  telefone!: string;
  cpfCnpj!: string;
  cnh!: string;
  salario!: number;
  onibusId!: number;
  onibus!: onibus;
  numeroIdentificacao!: string;
}

export type MotoristaId = motorista['id'];
