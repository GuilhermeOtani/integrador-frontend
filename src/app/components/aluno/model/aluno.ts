export default class aluno {
    id!: number;
    nome!: string;
    email!: string;
    telefone!: string
    matricula!: string;
    status_matricula!: string;
    data_cadastro!: Date;
    cpfCnpj!: string;
    faculdadeId!: number;
    faculdade!: any; 

}

export type AlunoId = aluno['id'];