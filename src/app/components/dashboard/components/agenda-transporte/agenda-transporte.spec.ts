import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AgendaTransporte } from './agenda-transporte';
import { alunoFixture, viagemFixture } from '../../testing/dashboard.fixtures';
import { TransporteResumo } from '../../models/dashboard.models';

describe('AgendaTransporte', () => {
  function criar(transporte = structuredClone(alunoFixture.transporte), chave: string | null = null) {
    const fixture = TestBed.createComponent(AgendaTransporte);
    fixture.componentRef.setInput('transporte', transporte);
    fixture.componentRef.setInput('dataReferencia', '2026-10-12');
    fixture.componentRef.setInput('chaveSelecionada', chave);
    fixture.detectChanges(); return fixture;
  }
  beforeEach(() => TestBed.configureTestingModule({ imports: [AgendaTransporte], providers: [provideNoopAnimations()] }));
  it('diálogo organiza ônibus, itinerário e destinos e fecha pelo rodapé', () => {
    const fixture = criar();
    fixture.componentInstance.detalhes(fixture.componentInstance.selecionada()!); fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.querySelector('.detalhe-destaque')!.textContent).toContain('ABC1234');
    expect(Array.from(dialog.querySelectorAll('.detalhe-parada')).map(item => item.textContent!.trim())).toEqual(['1', '2']);
    expect(Array.from(dialog.querySelectorAll('.detalhe-timeline li > div')).map(item => item.textContent!.trim())).toEqual(['Praça', 'Terminal']);
    expect(dialog.querySelectorAll('.detalhe-destinos li').length).toBe(2);
    expect(dialog.querySelector('.detalhe-grid')!.textContent).toContain('Modelo A');
    (dialog.querySelector('.detalhe-rodape button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(fixture.componentInstance.viagemDetalhe()).toBeNull();
    expect(fixture.componentInstance.rotaDetalhe()).toBeNull();
  });
  it('cards mostram o essencial, pontos em ordem e detalhes ficam no diálogo', () => {
    const fixture = criar(); const texto = fixture.nativeElement.textContent as string;
    for (const esperado of ['ABC1234', 'João', 'Faculdade A', 'Faculdade B', 'Praça', 'Terminal', '12/10/2026']) expect(texto).toContain(esperado);
    expect(texto.indexOf('Praça')).toBeLessThan(texto.indexOf('Terminal'));
    expect(fixture.nativeElement.querySelectorAll('[data-card]').length).toBe(4);
    expect(texto).not.toContain('Modelo A');
    fixture.componentInstance.detalhes(fixture.componentInstance.selecionada()!); fixture.detectChanges();
    const detalhes = fixture.nativeElement.textContent;
    for (const esperado of ['Modelo A', '40', 'Rua A', 'Rua B', 'Viagem #10', 'Campus']) expect(detalhes).toContain(esperado);
  });
  it('deduplica hoje sem eliminar ocorrências futuras da mesma viagem', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.agendaSemanal.push({ ...viagemFixture, dataOcorrencia: '2026-10-13' });
    const fixture = criar(dados);
    expect(fixture.componentInstance.viagens().length).toBe(2);
    expect(fixture.componentInstance.outrasViagens().map(v => v.dataOcorrencia)).toEqual(['2026-10-13']);
    fixture.componentInstance.selecionar('10:2026-10-13'); fixture.detectChanges();
    expect(fixture.componentInstance.selecionada()!.dataOcorrencia).toBe('2026-10-13');
    expect(fixture.nativeElement.textContent).toContain('13/10/2026');
  });
  it('seletor atualiza ônibus, motorista, rota e pontos da mesma ocorrência', () => {
    const dados = structuredClone(alunoFixture.transporte);
    const outra = structuredClone(viagemFixture); outra.id = 11;
    outra.onibus!.placa = 'XYZ9999'; outra.motorista!.nome = 'Maria';
    outra.rota = { id: 2, nome: 'Bairro', descricao: 'Outra rota', pontosEmbarque: [{ id: 5, descricao: 'Escola', ordemParada: 1 }] };
    outra.faculdades = [{ id: 9, nome: 'Faculdade C', endereco: 'Rua C' }];
    dados.viagensHoje.push(outra); dados.agendaSemanal.push(outra);
    const fixture = criar(dados); const seletor = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    seletor.value = '11:2026-10-12'; seletor.dispatchEvent(new Event('change')); fixture.detectChanges();
    const texto = (card: string) => fixture.nativeElement.querySelector('[data-card="' + card + '"]').textContent;
    expect(texto('onibus')).toContain('XYZ9999'); expect(texto('onibus')).toContain('Maria');
    expect(texto('onibus')).not.toContain('ABC1234');
    expect(texto('rota')).toContain('Bairro');
    expect(texto('pontos')).toContain('Escola'); expect(texto('pontos')).not.toContain('Praça');
    expect(texto('destinos')).toContain('Faculdade C'); expect(texto('destinos')).not.toContain('Faculdade A');
  });
  it('restaura seleção externa e escolhe primeira ocorrência se ela não existe mais', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.agendaSemanal.push({ ...viagemFixture, dataOcorrencia: '2026-10-13' });
    const fixture = criar(dados, '10:2026-10-13');
    expect(fixture.componentInstance.selecionada()!.dataOcorrencia).toBe('2026-10-13');
    fixture.componentRef.setInput('transporte', structuredClone(alunoFixture.transporte)); fixture.detectChanges();
    expect(fixture.componentInstance.selecionada()!.dataOcorrencia).toBe('2026-10-12');
  });
  it('seleção permanece ao atualizar os dados e os avisos são deduplicados', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.agendaSemanal.push({ ...viagemFixture, dataOcorrencia: '2026-10-13', avisos: ['Confirme a escala'] });
    const fixture = criar(dados);
    fixture.componentRef.setInput('avisos', ['Confirme a escala', 'Confirme a escala']);
    fixture.componentInstance.selecionar('10:2026-10-13'); fixture.detectChanges();
    fixture.componentRef.setInput('transporte', structuredClone(dados)); fixture.detectChanges();
    expect(fixture.componentInstance.selecionada()!.dataOcorrencia).toBe('2026-10-13');
    expect(fixture.componentInstance.alertas()).toEqual(['Confirme a escala']);
  });
  it('preserva viagem indisponível e todos os avisos, sem cancelar', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.viagensHoje[0].onibusDisponivel = false; dados.viagensHoje[0].onibus!.statusOnibus = 'QUEBRADO';
    dados.viagensHoje[0].avisos = ['Problema mecânico', 'Confirme a escala'];
    const fixture = criar(dados); const texto = fixture.nativeElement.textContent;
    for (const item of ['Quebrado', 'Problema mecânico', 'Confirme a escala', 'Ônibus indisponível']) expect(texto).toContain(item);
    expect(texto).not.toContain('cancelada');
  });
  it('resume três pontos e mantém todos no itinerário completo', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.viagensHoje[0].rota!.pontosEmbarque.push({ id: 3, descricao: 'Mercado', ordemParada: 3 }, { id: 4, descricao: 'Igreja', ordemParada: 4 });
    const fixture = criar(dados);
    expect(fixture.nativeElement.querySelector('[data-card="pontos"]').textContent).not.toContain('Igreja');
    expect(fixture.nativeElement.textContent).toContain('Ver itinerário completo (4)');
    fixture.componentInstance.detalhes(fixture.componentInstance.selecionada()!); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Igreja');
    fixture.componentInstance.fecharDetalhes(); expect(fixture.componentInstance.viagemDetalhe()).toBeNull();
  });
  it('não duplica aviso de indisponibilidade já enviado pelo backend', () => {
    const dados = structuredClone(alunoFixture.transporte);
    dados.viagensHoje[0].onibusDisponivel = false;
    dados.viagensHoje[0].avisos = ['Ônibus indisponível ou com estado não informado. Confirme a escala com a administração.'];
    const fixture = criar(dados);
    expect(fixture.componentInstance.alertas().length).toBe(1);
    expect(fixture.componentInstance.alertas()[0]).toContain('estado não informado');
  });
  it('sem grade não inventa ocorrência nem seleciona viagem não programada', () => {
    const dados: TransporteResumo = { viagensHoje: [], agendaSemanal: [], rotas: [], programacaoSemGrade: [{ ...viagemFixture, grade: null, dataOcorrencia: null, onibus: null, motorista: null, rota: null }] };
    const fixture = criar(dados);
    expect(fixture.componentInstance.selecionada()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Programação não definida');
    fixture.componentInstance.detalhes(dados.programacaoSemGrade[0]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('12/10/2026');
    expect(fixture.nativeElement.textContent).toContain('Não informado');
  });
  it('rota sem viagem aparece apenas como rota adicional, com detalhes', () => {
    const dados = structuredClone(alunoFixture.transporte); dados.viagensHoje = []; dados.agendaSemanal = [];
    const fixture = criar(dados); fixture.componentRef.setInput('perfil', 'aluno'); fixture.detectChanges();
    expect(fixture.componentInstance.rotasAdicionais().length).toBe(1);
    fixture.componentInstance.detalhesRota(dados.rotas[0]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rota cadastrada #1');
    expect(fixture.nativeElement.textContent).not.toContain('Viagem #');
  });
  it('não repete rotas já apresentadas e não cria seções vazias', () => {
    const fixture = criar(); fixture.componentRef.setInput('perfil', 'aluno'); fixture.detectChanges();
    for (const titulo of ['Outras rotas da sua faculdade', 'Programação não definida', 'Demais viagens programadas']) expect(fixture.nativeElement.textContent).not.toContain(titulo);
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });
  it('sem viagem hoje seleciona a próxima ocorrência e informa que é futura', () => {
    const dados = structuredClone(alunoFixture.transporte); dados.viagensHoje = [];
    dados.agendaSemanal = [{ ...viagemFixture, dataOcorrencia: '2026-10-13' }];
    const fixture = criar(dados);
    expect(fixture.nativeElement.textContent).toContain('Próxima ocorrência: 13/10/2026');
    expect(fixture.nativeElement.textContent).toContain('ABC1234');
  });
});
