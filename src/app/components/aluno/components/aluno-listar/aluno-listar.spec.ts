import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import Aluno, { SituacaoExclusaoAluno, SituacaoListaAluno } from '../../models/aluno';
import { AlunoListar } from './aluno-listar';

describe('AlunoListar — arquivamento e exclusão protegida', () => {
  let component: AlunoListar;
  let fixture: ComponentFixture<AlunoListar>;
  let http: HttpTestingController;
  let messages: jasmine.Spy;
  const url = `${environment.apiUrl}/aluno`;
  const ana = (): Aluno => ({ id: 1, nome: 'Ana', matricula: 'A1', mensalidade: 100,
    arquivado: false, faculdade: null } as Aluno);
  const bia = (): Aluno => ({ ...ana(), id: 2, nome: 'Bia' });
  const elegivel = (): SituacaoExclusaoAluno => ({ alunoId: 1, arquivado: true,
    podeExcluir: true, possuiAcesso: true,
    vinculos: { contasReceber: 0, contasPagar: 0, chamados: 0, viagens: 0 }, impedimentos: [] });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlunoListar],
      providers: [provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    fixture = TestBed.createComponent(AlunoListar);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    messages = spyOn(fixture.debugElement.injector.get(MessageService), 'add');
    fixture.detectChanges();
    const inicial = http.expectOne(r => r.url === `${url}/listar`);
    expect(inicial.request.params.get('situacao')).toBe('NAO_ARQUIVADOS');
    inicial.flush([ana()]);
    http.expectOne(`${environment.apiUrl}/faculdade/listar`).flush([]);
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  function carregar(dados: unknown[], filtro: SituacaoListaAluno = 'TODOS'): void {
    component.situacao = filtro;
    component.carregarAlunos();
    const req = http.expectOne(r => r.url === `${url}/listar`);
    expect(req.request.params.get('situacao')).toBe(filtro);
    req.flush(dados as object);
  }

  function abrirExclusao(dados: unknown = elegivel()): void {
    carregar([{ ...ana(), arquivado: true }], 'ARQUIVADOS');
    component.deleteAluno(component.alunos[0]);
    const req = http.expectOne(`${url}/1/situacao-exclusao`);
    expect(req.request.method).toBe('GET');
    req.flush(dados as object);
  }

  it('carrega não arquivados sem alterar cadastros', () => {
    expect(component.alunos).toEqual([ana()]);
    expect(component.contratoDisponivel()).toBeTrue();
    expect(component.carregando()).toBeFalse();
    http.expectNone(r => r.method !== 'GET');
  });

  it('consulta os três filtros no servidor e limpa seleção ao trocar', () => {
    for (const filtro of ['ARQUIVADOS', 'TODOS', 'NAO_ARQUIVADOS'] as SituacaoListaAluno[]) {
      component.selectedAlunos = [ana()];
      component.mudarSituacao(filtro);
      const req = http.expectOne(r => r.url === `${url}/listar`);
      expect(req.request.params.get('situacao')).toBe(filtro);
      expect(component.selectedAlunos).toEqual([]);
      req.flush([]);
    }
  });

  it('cancela consulta anterior na troca rápida de filtro', () => {
    component.carregarAlunos();
    const antigo = http.expectOne(r => r.url === `${url}/listar`);
    component.mudarSituacao('ARQUIVADOS');
    expect(antigo.cancelled).toBeTrue();
    const novo = http.expectOne(r => r.url === `${url}/listar`);
    novo.flush([{ ...ana(), arquivado: true }]);
    expect(component.alunos[0].arquivado).toBeTrue();
  });

  it('preserva seleção por ID quando atualiza a lista com novos objetos', () => {
    component.selectedAlunos = [ana()];
    carregar([{ ...ana(), nome: 'Ana atualizada' }]);
    expect(component.selectedAlunos[0].nome).toBe('Ana atualizada');
    expect(component.selectedAlunos[0]).toBe(component.alunos[0]);
  });

  it('preserva lista em erro de atualização mas bloqueia operações', () => {
    component.carregarAlunos();
    http.expectOne(r => r.url === `${url}/listar`).flush({ detail: 'Consulta indisponível' }, { status: 503, statusText: 'Unavailable' });
    expect(component.alunos).toEqual([ana()]);
    expect(component.erroLista()).toBe('Consulta indisponível');
    component.arquivarAluno(ana());
    expect(component.dialogAcao).toBeFalse();
    http.expectNone(r => r.method === 'PATCH');
  });

  it('não fabrica arquivamento para resposta de backend antigo', () => {
    const antigo = { id: 1, nome: 'Ana' };
    carregar([antigo], 'NAO_ARQUIVADOS');
    expect(component.contratoDisponivel()).toBeFalse();
    expect(component.erroLista()).toContain('GUIA_ARQUIVAMENTO');
    expect(component.alunos[0].arquivado).toBeUndefined();
    component.arquivarAluno(antigo as Aluno);
    expect(component.dialogAcao).toBeFalse();
    carregar([antigo], 'ARQUIVADOS');
    expect(component.alunos).toEqual([]);
  });

  it('não apresenta dados fora do filtro como se a API o respeitasse', () => {
    carregar([ana()], 'ARQUIVADOS');
    expect(component.alunos).toEqual([]);
    expect(component.erroLista()).toContain('fora do filtro');
    expect(component.contratoDisponivel()).toBeFalse();
  });

  it('mostra ausência real quando não existem alunos no filtro', () => {
    carregar([], 'ARQUIVADOS');
    fixture.detectChanges();
    expect(component.erroLista()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nenhum aluno encontrado');
  });

  it('exige confirmação para arquivar e cancelar não chama PATCH', () => {
    component.arquivarAluno(ana());
    expect(component.dialogAcao).toBeTrue();
    http.expectNone(r => r.method === 'PATCH');
    component.fecharAcao();
    component.confirmarAcao();
    http.expectNone(r => r.method === 'PATCH');
    expect(component.alunos).toEqual([ana()]);
  });

  it('arquiva somente após sucesso e remove da lista de não arquivados', () => {
    component.selectedAlunos = [ana()];
    component.arquivarAluno(ana()); component.confirmarAcao();
    const req = http.expectOne(`${url}/1/arquivamento`);
    expect(req.request.body).toEqual({ arquivado: true });
    expect(component.alunos).toEqual([ana()]);
    expect(component.processando()).toBeTrue();
    req.flush({ ...ana(), arquivado: true });
    expect(component.alunos).toEqual([]);
    expect(component.selectedAlunos).toEqual([]);
    expect(component.resultados()[0].estado).toBe('SUCESSO');
    expect(component.dialogAcao).toBeFalse();
    expect(messages.calls.mostRecent().args[0].detail).toContain('Histórico preservado');
    http.expectNone(r => r.method === 'DELETE');
  });

  it('bloqueia duplo clique e fechamento enquanto arquiva', () => {
    component.arquivarAluno(ana()); component.confirmarAcao(); component.confirmarAcao();
    component.fecharAcao(); component.restaurarAluno({ ...ana(), arquivado: true });
    expect(component.dialogAcao).toBeTrue();
    const req = http.expectOne(`${url}/1/arquivamento`);
    req.flush({ ...ana(), arquivado: true });
    http.expectNone(`${url}/1/arquivamento`);
  });

  it('atualiza estado sem remover aluno no filtro Todos', () => {
    carregar([ana()]);
    component.arquivarAluno(ana()); component.confirmarAcao();
    http.expectOne(`${url}/1/arquivamento`).flush({ ...ana(), arquivado: true });
    expect(component.alunos.length).toBe(1);
    expect(component.alunos[0].arquivado).toBeTrue();
  });

  it('restaura por PATCH sem reativar usuário ou gerar cobrança', () => {
    carregar([{ ...ana(), arquivado: true }], 'ARQUIVADOS');
    component.restaurarAluno(component.alunos[0]); component.confirmarAcao();
    const req = http.expectOne(`${url}/1/arquivamento`);
    expect(req.request.body).toEqual({ arquivado: false });
    req.flush(ana());
    expect(component.alunos).toEqual([]);
    expect(messages.calls.mostRecent().args[0].detail).toContain('separadamente em Usuários');
    http.expectNone(r => r.url.includes('/usuarios') || r.url.includes('/contareceber'));
  });

  it('preserva aluno e seleção quando arquivamento falha', () => {
    component.selectedAlunos = [ana()];
    component.arquivarAluno(ana()); component.confirmarAcao();
    http.expectOne(`${url}/1/arquivamento`).flush({ detail: 'Operação bloqueada' }, { status: 409, statusText: 'Conflict' });
    expect(component.alunos).toEqual([ana()]);
    expect(component.selectedAlunos).toEqual([ana()]);
    expect(component.resultados()[0].mensagem).toBe('Operação bloqueada');
    expect(component.erroAcao()).toContain('0 concluído(s)');
    expect(messages).not.toHaveBeenCalled();
    component.confirmarAcao();
    http.expectNone(`${url}/1/arquivamento`);
  });

  it('não confirma sucesso quando a resposta PATCH não corresponde ao aluno e estado', () => {
    component.arquivarAluno(ana()); component.confirmarAcao();
    http.expectOne(`${url}/1/arquivamento`).flush({ ...ana(), id: 2, arquivado: true });
    expect(component.alunos).toEqual([ana()]);
    expect(component.revisaoNecessaria()).toBeTrue();
    expect(component.resultados()[0].estado).toBe('FALHA');
    expect(messages).not.toHaveBeenCalled();
  });

  it('arquiva o lote sequencialmente e deduplica IDs selecionados', () => {
    carregar([ana(), bia()]);
    component.selectedAlunos = [ana(), bia(), ana()];
    component.arquivarSelecionados(); component.confirmarAcao();
    const primeira = http.expectOne(`${url}/1/arquivamento`);
    http.expectNone(`${url}/2/arquivamento`);
    primeira.flush({ ...ana(), arquivado: true });
    expect(component.processando()).toBeTrue();
    http.expectOne(`${url}/2/arquivamento`).flush({ ...bia(), arquivado: true });
    expect(component.resultados().map(item => item.estado)).toEqual(['SUCESSO', 'SUCESSO']);
    http.expectNone(`${url}/1/arquivamento`);
  });

  it('lote parcial conserva falhos selecionados sem desfazer sucessos', () => {
    carregar([ana(), bia()], 'NAO_ARQUIVADOS');
    component.selectedAlunos = [ana(), bia()];
    component.arquivarSelecionados(); component.confirmarAcao();
    http.expectOne(`${url}/1/arquivamento`).flush({ detail: 'Falha conhecida' }, { status: 400, statusText: 'Bad Request' });
    http.expectOne(`${url}/2/arquivamento`).flush({ ...bia(), arquivado: true });
    expect(component.alunos).toEqual([ana()]);
    expect(component.selectedAlunos).toEqual([ana()]);
    expect(component.resultados().map(item => item.estado)).toEqual(['FALHA', 'SUCESSO']);
    expect(component.erroAcao()).toContain('1 concluído(s); 1 não concluído(s)');
    expect(messages).not.toHaveBeenCalled();
  });

  it('não inclui arquivados no lote mesmo quando header os seleciona', () => {
    const arquivada = { ...bia(), arquivado: true };
    carregar([ana(), arquivada]); component.selectedAlunos = [ana(), arquivada];
    component.arquivarSelecionados();
    expect(component.alvosAcao().map(item => item.id)).toEqual([1]);
    component.confirmarAcao();
    http.expectOne(`${url}/1/arquivamento`).flush({ ...ana(), arquivado: true });
    http.expectNone(`${url}/2/arquivamento`);
  });

  for (const status of [0, 401, 403, 503]) {
    it(`interrompe lote em ${status}, sem repetir nem duplicar toast global`, () => {
      carregar([ana(), bia()]); component.selectedAlunos = [ana(), bia()];
      component.arquivarSelecionados(); component.confirmarAcao();
      const req = http.expectOne(`${url}/1/arquivamento`);
      if (status === 0) req.error(new ProgressEvent('error'));
      else req.flush({}, { status, statusText: 'Error' });
      http.expectNone(`${url}/2/arquivamento`);
      expect(component.selectedAlunos.length).toBe(2);
      expect(component.resultados().map(item => item.estado)).toEqual(['FALHA', 'NAO_TENTADO']);
      expect(component.revisaoNecessaria()).toBeTrue();
      expect(messages).not.toHaveBeenCalled();
      component.fecharAcao();
      carregar([ana(), bia()]);
      expect(component.revisaoNecessaria()).toBeFalse();
      http.expectNone(r => r.method === 'PATCH');
    });
  }

  it('cancela lote na destruição sem iniciar próximos itens ou anunciar sucesso', () => {
    carregar([ana(), bia()]); component.selectedAlunos = [ana(), bia()];
    component.arquivarSelecionados(); component.confirmarAcao();
    const req = http.expectOne(`${url}/1/arquivamento`);
    fixture.destroy();
    expect(req.cancelled).toBeTrue();
    http.expectNone(`${url}/2/arquivamento`);
    expect(messages).not.toHaveBeenCalled();
  });

  it('não oferece exclusão definitiva antes do arquivamento', () => {
    component.deleteAluno(ana());
    expect(component.dialogExclusao).toBeFalse();
    http.expectNone(r => r.url.includes('situacao-exclusao') || r.method === 'DELETE');
  });

  it('consulta condições antes da confirmação e mostra todos os vínculos', () => {
    const dados = { ...elegivel(), podeExcluir: false,
      vinculos: { contasReceber: 2, contasPagar: 0, chamados: 1, viagens: 0 },
      impedimentos: [{ codigo: 'CONTAS_RECEBER', mensagem: 'Há duas cobranças.' }, { codigo: 'CHAMADOS', mensagem: 'Há chamado encerrado.' }] };
    abrirExclusao(dados);
    fixture.detectChanges();
    expect(component.podeExcluir()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Há duas cobranças.');
    expect(fixture.nativeElement.textContent).toContain('Há chamado encerrado.');
    component.confirmarExclusao();
    http.expectNone(r => r.method === 'DELETE');
    expect(component.alunos.length).toBe(1);
  });

  it('condições elegíveis não disparam DELETE automaticamente', () => {
    abrirExclusao();
    expect(component.podeExcluir()).toBeTrue();
    http.expectNone(r => r.method === 'DELETE');
    component.fecharExclusao(); component.confirmarExclusao();
    http.expectNone(r => r.method === 'DELETE');
  });

  it('exclui somente após confirmação e 204, bloqueando duplo clique', () => {
    abrirExclusao(); component.selectedAlunos = [...component.alunos];
    component.confirmarExclusao(); component.confirmarExclusao(); component.fecharExclusao();
    const req = http.expectOne(`${url}/deletar-aluno/1`);
    expect(component.alunos.length).toBe(1);
    expect(component.dialogExclusao).toBeTrue();
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(component.alunos).toEqual([]);
    expect(component.selectedAlunos).toEqual([]);
    expect(component.dialogExclusao).toBeFalse();
    expect(messages.calls.mostRecent().args[0].summary).toBe('Exclusão concluída');
  });

  it('conflito no DELETE preserva linha e exibe vínculos novos sem reutilizar autorização antiga', () => {
    abrirExclusao(); component.confirmarExclusao();
    const vinculos = { contasReceber: 1, contasPagar: 0, chamados: 0, viagens: 0 };
    http.expectOne(`${url}/deletar-aluno/1`).flush({ detail: 'O aluno possui registros vinculados.',
      codigo: 'ALUNO_POSSUI_VINCULOS', vinculos }, { status: 409, statusText: 'Conflict' });
    expect(component.alunos.length).toBe(1);
    expect(component.erroExclusao()).toBe('O aluno possui registros vinculados.');
    expect(component.conflitoVinculos()).toEqual(vinculos);
    expect(component.situacaoExclusao()).toBeNull();
    component.confirmarExclusao();
    http.expectNone(r => r.method === 'DELETE');
    expect(messages).not.toHaveBeenCalled();
  });

  it('erro de rede no DELETE não anuncia sucesso nem repete exclusão', () => {
    abrirExclusao(); component.confirmarExclusao();
    http.expectOne(`${url}/deletar-aluno/1`).error(new ProgressEvent('error'));
    expect(component.alunos.length).toBe(1);
    expect(component.revisaoNecessaria()).toBeTrue();
    expect(component.erroExclusao()).toContain('Exclusão não confirmada');
    expect(messages).not.toHaveBeenCalled();
    component.confirmarExclusao(); http.expectNone(r => r.method === 'DELETE');
  });

  for (const dados of [{}, { ...elegivel(), alunoId: 999 }, { ...elegivel(), arquivado: false },
    { ...elegivel(), vinculos: { contasReceber: 1, contasPagar: 0, chamados: 0, viagens: 0 } }]) {
    it(`bloqueia resposta de condições incompatível: ${JSON.stringify(dados)}`, () => {
      abrirExclusao(dados);
      expect(component.podeExcluir()).toBeFalse();
      expect(component.erroExclusao()).toContain('incompletas ou incompatíveis');
      component.confirmarExclusao(); http.expectNone(r => r.method === 'DELETE');
    });
  }

  it('falha de endpoint de condições permite nova consulta, nunca exclusão local', () => {
    carregar([{ ...ana(), arquivado: true }], 'ARQUIVADOS');
    component.deleteAluno(component.alunos[0]);
    http.expectOne(`${url}/1/situacao-exclusao`).flush({}, { status: 404, statusText: 'Not Found' });
    expect(component.erroExclusao()).toContain('guia de arquivamento');
    expect(component.podeExcluir()).toBeFalse();
    component.atualizarSituacaoExclusao();
    http.expectOne(`${url}/1/situacao-exclusao`).flush(elegivel());
    expect(component.podeExcluir()).toBeTrue();
    http.expectNone(r => r.method === 'DELETE');
  });

  it('fecha e cancela consulta de condições sem vazar para outro aluno', () => {
    carregar([{ ...ana(), arquivado: true }], 'ARQUIVADOS');
    component.deleteAluno(component.alunos[0]);
    const req = http.expectOne(`${url}/1/situacao-exclusao`);
    component.fecharExclusao();
    expect(req.cancelled).toBeTrue();
    expect(component.situacaoExclusao()).toBeNull();
    expect(component.alunoExclusao()).toBeNull();
    expect(component.consultandoExclusao()).toBeFalse();
  });

  it('nova consulta apaga autorização antiga enquanto carrega', () => {
    abrirExclusao(); component.atualizarSituacaoExclusao();
    expect(component.situacaoExclusao()).toBeNull(); expect(component.podeExcluir()).toBeFalse();
    const req = http.expectOne(`${url}/1/situacao-exclusao`);
    component.confirmarExclusao(); http.expectNone(r => r.method === 'DELETE');
    req.flush({ ...elegivel(), podeExcluir: false, impedimentos: [{ codigo: 'X', mensagem: 'Bloqueado' }] });
    expect(component.podeExcluir()).toBeFalse();
  });

  it('usa interpolação segura nas mensagens e identifica os botões por nome', () => {
    carregar([{ ...ana(), nome: '<img src=x onerror=alert(1)>' }], 'NAO_ARQUIVADOS');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(fixture.nativeElement.querySelector('button[aria-label^="Arquivar aluno"]')).not.toBeNull();
  });

  it('preserva edição e faculdade de aluno arquivado sem desarquivar localmente', () => {
    const dados = { ...ana(), arquivado: true, faculdade: { id: 7, nome: 'Universidade' } };
    carregar([dados], 'ARQUIVADOS'); component.editAluno(component.alunos[0]);
    expect(component.aluno.faculdadeId).toBe(7);
    expect(component.aluno.arquivado).toBeTrue();
    component.aluno.nome = 'Nome editado';
    expect(component.alunos[0].nome).toBe('Ana');
    http.expectNone(r => r.method === 'PATCH');
  });
});
