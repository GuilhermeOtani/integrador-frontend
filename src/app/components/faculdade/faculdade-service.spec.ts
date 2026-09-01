import { TestBed } from '@angular/core/testing';

import { FaculdadeService } from './faculdade-service';

describe('FaculdadeService', () => {
  let service: FaculdadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaculdadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
