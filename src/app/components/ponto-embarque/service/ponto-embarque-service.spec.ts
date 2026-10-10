import { TestBed } from '@angular/core/testing';

import { PontoEmbarqueService } from './ponto-embarque-service';

describe('PontoEmbarqueService', () => {
  let service: PontoEmbarqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PontoEmbarqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
