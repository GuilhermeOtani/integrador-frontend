import { TestBed } from '@angular/core/testing';
import { ChamadoDetalhe } from './chamado-detalhe';
import { CHAMADO_TESTE } from '../../testing/manutencao.fixtures';

describe('ChamadoDetalhe', () => {
  it('destaca chamado, ônibus, solicitante, prioridade e estado em blocos separados', () => {
    TestBed.configureTestingModule({ imports: [ChamadoDetalhe] });
    const fixture = TestBed.createComponent(ChamadoDetalhe);
    fixture.componentRef.setInput('chamado', CHAMADO_TESTE); fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detalhe-valor')!.textContent).toContain('Chamado #4');
    expect(el.querySelector('.chamado-onibus dd')!.textContent).toContain('101');
    expect(el.querySelector('.chamado-tags')!.textContent).toContain('Prioridade Média');
    expect(el.querySelector('.chamado-tags')!.textContent).toContain('Aberto');
    expect(el.textContent).toContain('ABC1D23'); expect(el.textContent).toContain('Modelo teste');
    expect(el.textContent).toContain('Aluno Teste'); expect(el.textContent).toContain('Quebrado');
  });
  it('oculta resposta anterior no atendimento sem ocultar relato ou autor', () => {
    TestBed.configureTestingModule({ imports: [ChamadoDetalhe] });
    const fixture = TestBed.createComponent(ChamadoDetalhe);
    fixture.componentRef.setInput('chamado', CHAMADO_TESTE);
    fixture.componentRef.setInput('mostrarResposta', false); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ar-condicionado');
    expect(fixture.nativeElement.textContent).toContain('Aluno Teste');
    expect(fixture.nativeElement.querySelector('[aria-label="Resposta da administração"]')).toBeNull();
  });
  it('preserva quebras de linha e textos longos do relato', () => {
    TestBed.configureTestingModule({ imports: [ChamadoDetalhe] });
    const fixture = TestBed.createComponent(ChamadoDetalhe);
    const descricao = 'Primeira linha\n' + 'x'.repeat(2000);
    fixture.componentRef.setInput('chamado', { ...CHAMADO_TESTE, descricao }); fixture.detectChanges();
    const relato = fixture.nativeElement.querySelector('.relato-original') as HTMLElement;
    expect(relato.textContent).toBe(descricao);
    expect(getComputedStyle(relato).whiteSpace).toBe('pre-wrap');
    expect(getComputedStyle(relato).overflowWrap).toBe('anywhere');
  });
  it('renderiza relato e resposta como texto, sem interpretar HTML', () => {
    TestBed.configureTestingModule({ imports: [ChamadoDetalhe] });
    const fixture = TestBed.createComponent(ChamadoDetalhe);
    fixture.componentRef.setInput('chamado', { ...CHAMADO_TESTE, descricao: '<img src=x onerror=alert(1)>\nProblema', observacaoAdmin: '<script>teste</script>' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(fixture.nativeElement.textContent).toContain('<script>teste</script>');
  });
  it('exibe aguardando resposta e preserva a data e o estado desconhecido', () => {
    TestBed.configureTestingModule({ imports: [ChamadoDetalhe] });
    const fixture = TestBed.createComponent(ChamadoDetalhe);
    fixture.componentRef.setInput('chamado', { ...CHAMADO_TESTE, observacaoAdmin: null,
      onibus: { id: 3, numeroIdentificacao: null, placa: null, modelo: null, statusOnibus: null },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aguardando resposta');
    expect(fixture.nativeElement.textContent).toContain('Não informado');
    expect(fixture.nativeElement.textContent).toContain('08/10/2026');
  });
});
