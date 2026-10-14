import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import Aluno, { SituacaoListaAluno } from '../models/aluno';
import { AlunoService } from './aluno-service';

describe('AlunoService', () => {
  let service: AlunoService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/aluno`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AlunoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('usa não arquivados como filtro inicial', () => {
    service.listarAlunos().subscribe();
    const req = http.expectOne(r => r.url === `${url}/listar`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('situacao')).toBe('NAO_ARQUIVADOS');
    req.flush([]);
  });

  for (const situacao of ['NAO_ARQUIVADOS', 'ARQUIVADOS', 'TODOS'] as SituacaoListaAluno[]) {
    it(`envia o filtro ${situacao} para o servidor`, () => {
      service.listarAlunos(situacao).subscribe();
      const req = http.expectOne(r => r.url === `${url}/listar`);
      expect(req.request.params.get('situacao')).toBe(situacao);
      req.flush([]);
    });
  }

  for (const arquivado of [true, false]) {
    it(`envia somente arquivado=${arquivado} no PATCH dedicado`, () => {
      service.atualizarArquivamento(7, arquivado).subscribe();
      const req = http.expectOne(`${url}/7/arquivamento`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ arquivado });
      expect(req.request.params.keys()).toEqual([]);
      req.flush({ id: 7, arquivado });
    });
  }

  it('consulta os vínculos sem mutação', () => {
    service.consultarSituacaoExclusao(7).subscribe();
    const req = http.expectOne(`${url}/7/situacao-exclusao`);
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('mantém o DELETE existente sem corpo', () => {
    service.ExcluirAlunos(7).subscribe();
    const req = http.expectOne(`${url}/deletar-aluno/7`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  for (const editar of [true, false]) {
    it(`não envia arquivamento, identidade ou objetos relacionados no ${editar ? 'PUT' : 'POST'} do cadastro`, () => {
      const aluno = { id: 7, nome: 'Ana', matricula: 'A7', mensalidade: 100, cpfCnpj: 'cpf', telefone: 'tel',
        faculdadeId: 3, faculdade: { id: 3 }, arquivado: true, email: 'teste@example.test' } as Aluno;
      (editar ? service.EditarAlunos(aluno) : service.CadastroAlunos(aluno)).subscribe();
      const req = http.expectOne(editar ? `${url}/atualizar-aluno/7` : `${url}/salvar-aluno`);
      expect(req.request.method).toBe(editar ? 'PUT' : 'POST');
      expect(req.request.body).toEqual({ nome: 'Ana', matricula: 'A7', mensalidade: 100,
        cpfCnpj: 'cpf', telefone: 'tel', faculdadeId: 3 });
      req.flush(aluno);
    });
  }
});
