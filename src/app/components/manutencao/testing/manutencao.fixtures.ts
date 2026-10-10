import { ChamadoManutencao, OnibusChamado } from '../models/manutencao.models';

export const ONIBUS_TESTE: OnibusChamado = {
  id: 3, numeroIdentificacao: '101', placa: 'ABC1D23', modelo: 'Modelo teste', statusOnibus: 'QUEBRADO',
};
export const CHAMADO_TESTE: ChamadoManutencao = {
  id: 4, descricao: 'Ar-condicionado\nquebrado', dataAbertura: '2026-10-08', urgencia: 'MEDIA',
  status: 'ABERTO', observacaoAdmin: 'Resposta anterior', onibus: ONIBUS_TESTE,
  solicitante: { pessoaId: 20, nome: 'Aluno Teste', tipoPessoa: 'ALUNO' },
};
