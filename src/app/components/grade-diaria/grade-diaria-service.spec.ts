import { TestBed } from '@angular/core/testing';

import { GradeDiariaService } from './grade-diaria-service';

describe('GradeDiariaService', () => {
  let service: GradeDiariaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GradeDiariaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
