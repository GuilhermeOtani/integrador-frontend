import { TestBed } from '@angular/core/testing';
import { ChamadoDetalhe } from './chamado-detalhe';
import { CHAMADO_TESTE } from '../../testing/manutencao.fixtures';

describe('ChamadoDetalhe', () => {
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
