import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ManutencaoService } from './manutencao.service';
import { AtenderChamado } from '../models/manutencao.models';

describe('ManutencaoService', () => {
  let service: ManutencaoService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/chamados-manutencao`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ManutencaoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta ônibus mínimos, próprios chamados e detalhe sem identificar o usuário', () => {
    service.listarOnibus().subscribe();
    service.minhas().subscribe();
    service.buscar(4).subscribe();
    for (const path of ['/onibus', '/minhas', '/4']) {
      const request = http.expectOne(url + path);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.keys()).toEqual([]);
      request.flush(path === '/4' ? {} : []);
    }
  });
  it('abre somente com ônibus e descrição, sem autoria ou prioridade', () => {
    service.abrir({ onibusId: 3, descricao: 'Ar quebrado', pessoaId: 99, urgencia: 'ALTA' } as any).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ onibusId: 3, descricao: 'Ar quebrado' });
    req.flush({});
  });
  it('lista todos sem parâmetros de paginação ou filtros vazios', () => {
    service.listar().subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([]);
  });
  it('envia os três filtros preenchidos', () => {
    service.listar({ status: 'ABERTO', urgencia: 'ALTA', onibusId: 8 }).subscribe();
    const req = http.expectOne(r => r.url === url);
    expect(req.request.params.keys().sort()).toEqual(['onibusId', 'status', 'urgencia']);
    expect(req.request.params.get('status')).toBe('ABERTO');
    expect(req.request.params.get('urgencia')).toBe('ALTA');
    expect(req.request.params.get('onibusId')).toBe('8');
    req.flush([]);
  });
  it('atende sem regravar dados do ônibus e sem estado implícito', () => {
    service.atender(4, { urgencia: 'MEDIA', status: 'RESOLVIDO', observacaoAdmin: 'Consertado', fotoUrl: 'foto', solicitante: {} } as AtenderChamado).subscribe();
    const req = http.expectOne(url + '/4/atendimento');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ urgencia: 'MEDIA', status: 'RESOLVIDO', observacaoAdmin: 'Consertado' });
    req.flush({});
  });
  it('inclui somente a alteração explícita do estado do ônibus', () => {
    service.atender(4, { urgencia: 'ALTA', status: 'EM_ANDAMENTO', observacaoAdmin: null, statusOnibus: 'MANUTENCAO' }).subscribe();
    const req = http.expectOne(url + '/4/atendimento');
    expect(req.request.body).toEqual({ urgencia: 'ALTA', status: 'EM_ANDAMENTO', observacaoAdmin: null, statusOnibus: 'MANUTENCAO' });
    req.flush({});
  });
});
