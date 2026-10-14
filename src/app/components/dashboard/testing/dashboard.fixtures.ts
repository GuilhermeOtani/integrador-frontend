import { AdminDashboard, AlunoDashboard, MotoristaDashboard, ViagemResumo } from '../models/dashboard.models';

export const viagemFixture: ViagemResumo = {
  id: 10, grade: { id: 1, diaSemana: 'SEGUNDA', descricao: 'Campus' }, dataOcorrencia: '2026-10-12',
  rota: { id: 1, nome: 'Centro', descricao: 'Até os campi', pontosEmbarque: [
    { id: 1, descricao: 'Praça', ordemParada: 1 }, { id: 2, descricao: 'Terminal', ordemParada: 2 },
  ] }, onibus: { id: 1, numeroIdentificacao: '01', placa: 'ABC1234', modelo: 'Modelo A', capacidade: 40, statusOnibus: 'OPERANDO' },
  motorista: { pessoaId: 3, nome: 'João' }, faculdades: [
    { id: 1, nome: 'Faculdade A', endereco: 'Rua A' }, { id: 2, nome: 'Faculdade B', endereco: 'Rua B' },
  ], onibusDisponivel: true, avisos: [],
};
export const alunoFixture: AlunoDashboard = {
  dataReferencia: '2026-10-12', geradoEm: '2026-10-12T12:00:00-03:00',
  aluno: { pessoaId: 2, nome: 'Ana', matricula: '2026001', statusMatricula: 'PENDENTE' },
  faculdade: { id: 1, nome: 'Faculdade A', endereco: 'Rua A' },
  transporte: { viagensHoje: [viagemFixture], agendaSemanal: [viagemFixture], programacaoSemGrade: [], rotas: [viagemFixture.rota!] },
  financeiro: { mensalidadeCadastro: 250, cobrancaPrincipal: { id: 42, descricao: 'Mensalidade Ana', valor: 230,
    dataVencimento: '2026-10-12', status: 'PENDENTE', situacao: 'VENCE_HOJE', diasParaVencimento: 0 },
    emAberto: { quantidade: 1, valor: 230 }, vencidas: { quantidade: 0, valor: 0 } }, avisos: [],
};
export const motoristaFixture: MotoristaDashboard = {
  dataReferencia: alunoFixture.dataReferencia, geradoEm: alunoFixture.geradoEm,
  motorista: { pessoaId: 3, nome: 'João' }, transporte: alunoFixture.transporte, avisos: [],
};
export const adminFixture: AdminDashboard = {
  dataReferencia: alunoFixture.dataReferencia, geradoEm: alunoFixture.geradoEm, mes: '2026-10',
  financeiro: { recebidoNoMes: 100, pagoNoMes: 200, saldoMovimentacoes: -100,
    contasReceber: { emAberto: { quantidade: 1, valor: 230 }, vencidas: { quantidade: 0, valor: 0 }, vencemEmSeteDias: { quantidade: 1, valor: 230 } },
    contasPagar: { emAberto: { quantidade: 0, valor: 0 }, vencidas: { quantidade: 0, valor: 0 }, vencemEmSeteDias: { quantidade: 0, valor: 0 } },
    serieMensal: ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'].map(mes => ({ mes, recebido: 0, pago: 0, saldoMovimentacoes: 0 })),
    pendenciasReceber: [], pendenciasPagar: [] },
  operacao: { alunos: { total: 1, ativos: 0, inativos: 0, pendentes: 1, semStatus: 0 },
    onibus: { total: 1, operando: 1, manutencao: 0, quebrado: 0, inativo: 0, semStatus: 0 },
    viagensHoje: 1, viagensSemProgramacao: 0, chamados: { abertos: 0, emAndamento: 0, prioridadeAlta: 0 }, chamadosPendentes: [] },
};
