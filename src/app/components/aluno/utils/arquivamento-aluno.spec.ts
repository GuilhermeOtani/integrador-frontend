import { HttpErrorResponse } from '@angular/common/http';
import { SituacaoExclusaoAluno } from '../models/aluno';
import { mensagemArquivamentoAluno, requerRevisaoAluno, situacaoExclusaoValida,
  TIPOS_VINCULOS_ALUNO, vinculosValidos } from './arquivamento-aluno';

describe('proteção de exclusão de alunos', () => {
  const situacao = (): SituacaoExclusaoAluno => ({ alunoId: 7, arquivado: true, podeExcluir: true,
    possuiAcesso: false, vinculos: { contasReceber: 0, contasPagar: 0, chamados: 0, viagens: 0 }, impedimentos: [] });

  it('aceita situação completa sem vínculos e zero real', () => {
    expect(situacaoExclusaoValida(situacao(), 7)).toBeTrue();
  });

  for (const { chave } of TIPOS_VINCULOS_ALUNO) {
    it(`não libera exclusão contraditória com ${chave}`, () => {
      const dados = situacao(); dados.vinculos[chave] = 1;
      expect(situacaoExclusaoValida(dados, 7)).toBeFalse();
      dados.podeExcluir = false;
      dados.impedimentos = [{ codigo: chave, mensagem: 'Histórico preservado.' }];
      expect(situacaoExclusaoValida(dados, 7)).toBeTrue();
    });
  }

  it('rejeita outro aluno, situação ausente e campos incompletos', () => {
    expect(situacaoExclusaoValida(situacao(), 8)).toBeFalse();
    expect(situacaoExclusaoValida(null, 7)).toBeFalse();
    expect(situacaoExclusaoValida({}, 7)).toBeFalse();
    expect(situacaoExclusaoValida({ ...situacao(), possuiAcesso: null }, 7)).toBeFalse();
    expect(situacaoExclusaoValida({ ...situacao(), impedimentos: null }, 7)).toBeFalse();
  });

  it('rejeita autorização contraditória para não arquivado ou com impedimento', () => {
    expect(situacaoExclusaoValida({ ...situacao(), arquivado: false }, 7)).toBeFalse();
    expect(situacaoExclusaoValida({ ...situacao(), impedimentos: [{ codigo: 'X', mensagem: 'Bloqueado' }] }, 7)).toBeFalse();
    expect(situacaoExclusaoValida({ ...situacao(), impedimentos: [null] }, 7)).toBeFalse();
  });

  it('não interpreta campos ausentes, negativos ou textos como zero vínculos', () => {
    for (const numero of [undefined, null, -1, 0.5, '0', NaN, Infinity]) {
      expect(vinculosValidos({ ...situacao().vinculos, chamados: numero })).toBeFalse();
    }
  });

  it('explica endpoint não disponível sem inventar suporte local', () => {
    expect(mensagemArquivamentoAluno(new HttpErrorResponse({ status: 404 }))).toContain('guia de arquivamento');
    expect(mensagemArquivamentoAluno(new HttpErrorResponse({ status: 409, error: { detail: 'Há contas vinculadas' } })))
      .toBe('Há contas vinculadas');
  });

  it('distingue resultado incerto de conflito conhecido', () => {
    for (const status of [0, 408, 500, 503]) expect(requerRevisaoAluno(new HttpErrorResponse({ status }))).toBeTrue();
    for (const status of [400, 404, 409]) expect(requerRevisaoAluno(new HttpErrorResponse({ status }))).toBeFalse();
  });
});
