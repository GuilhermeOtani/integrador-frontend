import { TestBed } from '@angular/core/testing';

import { PontoEmbarque } from './ponto-embarque-service';

describe('PontoEmbarque', () => {
  let service: PontoEmbarque;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PontoEmbarque);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
