import { FormControl } from '@angular/forms';
import { viagemFixture } from '../../dashboard/testing/dashboard.fixtures';
import { agruparProgramacao, dataCivilValida, diaEmail, diaSaoPaulo, ESTADOS_EMAIL, instanteEmail, rotuloEmail, severidadeEmail, textoEmail, textoObrigatorio } from './email-programacao.utils';
describe('Utilitários da programação por e-mail', () => {
  it('preserva o dia civil e rejeita datas impossíveis', () => { expect(diaEmail('2026-10-14')).toBe('14/10/2026'); for (const d of ['2026-02-30', '0000-01-01', '', '2026-1-1']) expect(dataCivilValida(d)).toBeFalse(); expect(diaEmail(null)).toBe('Não informado'); });
  it('calcula o dia em São Paulo na virada UTC', () => { expect(diaSaoPaulo(new Date('2026-10-15T01:30:00Z'))).toBe('2026-10-14'); });
  it('instantes inválidos não produzem data fictícia', () => { expect(instanteEmail(null)).toBe('Não informado'); expect(instanteEmail('inválido')).toBe('Não informado'); expect(instanteEmail('2026-10-15T01:30:00Z')).toContain('14/10/2026'); });
  it('todos os sete estados têm rótulos, sem confirmação de leitura', () => { expect(ESTADOS_EMAIL.length).toBe(7); for (const e of ESTADOS_EMAIL) { expect(rotuloEmail(e.value)).toBe(e.label); expect(severidadeEmail(e.value)).toBe(e.severity); } expect(ESTADOS_EMAIL.some(e => (e.value as string) === 'ENTREGUE')).toBeFalse(); });
  it('motivo obrigatório não aceita apenas espaços', () => { expect(textoObrigatorio(new FormControl('  '))).toEqual({ required: true }); expect(textoObrigatorio(new FormControl('Troca de veículo'))).toBeNull(); });
  it('agrupa múltiplos destinos sem alterar a viagem nem duplicar faculdade', () => {
    const v = structuredClone(viagemFixture); v.faculdades.push(v.faculdades[0]); const grupos = agruparProgramacao([v]);
    expect(grupos.map(g => g.nome)).toEqual(['Faculdade A', 'Faculdade B']); expect(grupos[0].viagens.length).toBe(1); expect(grupos[0].viagens[0]).toBe(v); expect(v.faculdades.length).toBe(3);
  });
  it('pesquisa por faculdade, rota, ônibus e motorista é só visual', () => { for (const p of ['Faculdade A', '01', 'joão', 'Centro']) expect(agruparProgramacao([viagemFixture], p).length).toBeGreaterThan(0); expect(agruparProgramacao([viagemFixture], 'ausente')).toEqual([]); });
  it('destino/nome nulos preservados e ônibus não inventado', () => { expect(agruparProgramacao([{ ...viagemFixture, faculdades: [] }])[0].nome).toBe('Destino não informado'); expect(agruparProgramacao([{ ...viagemFixture, faculdades: [{ id: 1, nome: null, endereco: null }] }])[0].nome).toBe('Faculdade sem nome'); expect(textoEmail(null)).toBe('Não informado'); });
});
