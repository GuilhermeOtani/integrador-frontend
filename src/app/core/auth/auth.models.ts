export type Papel = 'ADMIN' | 'ALUNO' | 'MOTORISTA';
export type StatusMatricula = 'ATIV0' | 'INATIV0' | 'PENDENTE';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface UsuarioResumo {
  id: number;
  email: string;
  tipoPessoa: Papel;
  pessoaId: number;
  nome: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: UsuarioResumo;
}

export interface AlunoPerfil {
  matricula: string | null;
  statusMatricula: StatusMatricula | null;
  dataCadastro: string | null;
  mensalidade: number | null;
  faculdadeId: number | null;
}

export interface MotoristaPerfil {
  cnh: string | null;
  salario: number | null;
}

export interface PessoaPerfil {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  aluno: AlunoPerfil | null;
  motorista: MotoristaPerfil | null;
}

export interface MeResponse {
  id: number;
  email: string;
  tipoPessoa: Papel;
  pessoa: PessoaPerfil;
}

export interface Sessao {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: number;
  usuario: UsuarioResumo;
}

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

export interface PessoaDisponivelResponse {
  id: number;
  nome: string;
  tipoPessoa: Exclude<Papel, 'ADMIN'>;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}
