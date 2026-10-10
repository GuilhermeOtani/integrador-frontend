import { Papel } from '../../../core/auth/models/auth.models';

export interface CriarUsuarioRequest {
  pessoaId: number;
  email: string;
  senha: string;
}

export interface CriarAdminRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AtualizarEmailUsuarioRequest {
  email: string;
}

export interface RedefinirSenhaUsuarioRequest {
  senha: string;
}

export interface AtualizarStatusUsuarioRequest {
  ativo: boolean;
}

export interface PessoaDisponivelResponse {
  id: number;
  nome: string;
  tipoPessoa: Exclude<Papel, 'ADMIN'>;
}
