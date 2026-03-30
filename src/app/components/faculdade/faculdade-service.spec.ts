import { TestBed } from '@angular/core/testing';

import { Faculdade } from './faculdade';

describe('Faculdade', () => {
  let service: Faculdade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Faculdade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
