import { FormControl } from '@angular/forms';
import { idOnibusParametro, rotuloEstadoOnibus, rotuloOnibus, textoObrigatorio } from './manutencao.utils';

describe('utilitários de manutenção', () => {
  it('aceita apenas ID inteiro positivo seguro no atalho', () => {
    expect(idOnibusParametro('14')).toBe(14);
    for (const valor of [null, '', '0', '-1', '2.5', 'abc', '1e2', ' 3', '01', '9007199254740992']) {
      expect(idOnibusParametro(valor)).withContext(String(valor)).toBeNull();
    }
  });
  it('não inventa um estado para cadastros antigos', () => {
    expect(rotuloEstadoOnibus(null)).toBe('Não informado');
    expect(rotuloEstadoOnibus('OPERANDO')).toBe('Operando');
    expect(rotuloOnibus({ id: 1, numeroIdentificacao: null, placa: null, modelo: null, statusOnibus: null })).toBe('Não informado — Não informado — Não informado');
  });
  it('rejeita relato composto apenas por espaços', () => {
    expect(textoObrigatorio(new FormControl(' \n\t'))).toEqual({ required: true });
    expect(textoObrigatorio(new FormControl(' Ar quebrado '))).toBeNull();
  });
});
