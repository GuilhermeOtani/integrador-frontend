import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
/** Apenas notifica invalidação; não armazena dados financeiros nem faz chamadas HTTP. */
@Injectable({ providedIn: 'root' })
export class FinanceiroEventos {
  private readonly eventos = new Subject<void>();
  readonly alterado = this.eventos.asObservable();
  invalidar(): void { this.eventos.next(); }
}
