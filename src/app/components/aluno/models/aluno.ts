export default class aluno {
    id!: number;
    nome!: string;
    email!: string;
    telefone!: string
    matricula!: string;
    mensalidade!: number | null;
    status_matricula!: string;
    data_cadastro!: Date;
    cpfCnpj!: string;
    faculdadeId!: number;
    faculdade!: any; 
    arquivado!: boolean;

}

export type AlunoId = aluno['id'];

export type SituacaoListaAluno = 'NAO_ARQUIVADOS' | 'ARQUIVADOS' | 'TODOS';

export interface VinculosAluno {
    contasReceber: number;
    contasPagar: number;
    chamados: number;
    viagens: number;
}

export interface ImpedimentoExclusaoAluno {
    codigo: string;
    mensagem: string;
}

export interface SituacaoExclusaoAluno {
    alunoId: number;
    arquivado: boolean;
    podeExcluir: boolean;
    possuiAcesso: boolean;
    vinculos: VinculosAluno;
    impedimentos: ImpedimentoExclusaoAluno[];
}
