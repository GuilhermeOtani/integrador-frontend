import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RelatoriosService } from '../../service/relatorios-service';
import { SaldoBase } from '../../models/relatorios.models';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { dataFinanceiraValida, diaFinanceiro, moedaFinanceira, valorFinanceiroValido } from '../../../../core/financeiro/financeiro.utils';
import { FinanceiroEventos } from '../../../../core/financeiro/financeiro-eventos.service';
@Component({
  selector: 'app-saldo-base', standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule],
  templateUrl: './saldo-base.html', styleUrl: '../../styles/financeiro.css',
})
export class SaldoBaseEditor implements OnInit {
  private readonly api = inject(RelatoriosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventos = inject(FinanceiroEventos);
  readonly bloqueado = input(false);
  readonly carregado = output<SaldoBase | null>();
  readonly salvo = output<SaldoBase>();
  readonly base = signal<SaldoBase | null>(null);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly conhecido = signal(false);
  readonly erro = signal('');
  readonly aviso = signal('');
  visivel = false;
  readonly moeda = moedaFinanceira; readonly dia = diaFinanceiro;
  readonly form = new FormGroup({
    dataReferencia: new FormControl('', { nonNullable: true, validators: c => dataFinanceiraValida(c.value) ? null : { data: true } }),
    saldo: new FormControl<number | null>(null, [Validators.required, c => valorFinanceiroValido(c.value) ? null : { valor: true }]),
  });
  ngOnInit(): void { this.carregar(); }
  carregar(abrir = false, conflito = false): void {
    if (this.carregando() || this.salvando()) return;
    this.carregando.set(true); this.conhecido.set(false); this.erro.set(''); this.carregado.emit(null);
    this.api.saldoBase().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false))).subscribe({
      next: base => {
        this.base.set(base); this.conhecido.set(true); this.carregado.emit(base);
        if (abrir || conflito) this.abrir();
        if (conflito) this.aviso.set('O saldo foi alterado por outro administrador. Os dados atuais foram carregados; revise antes de salvar novamente.');
      },
      error: (e: HttpErrorResponse) => {
        this.base.set(null);
        if (e.status === 404) { this.conhecido.set(true); this.abrir(); }
        else this.erro.set(mensagemApi(e));
      },
    });
  }
  abrir(): void {
    if (!this.conhecido() || this.bloqueado() || this.salvando()) return;
    const b = this.base(); this.form.reset({ dataReferencia: b?.dataReferencia ?? '', saldo: b?.saldo ?? null });
    this.erro.set(''); this.aviso.set(''); this.visivel = true;
  }
  salvar(): void {
    if (this.salvando() || this.carregando() || this.bloqueado() || !this.conhecido()) return;
    this.form.markAllAsTouched(); if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.salvando.set(true); this.form.disable({ emitEvent: false }); this.erro.set(''); this.aviso.set('');
    this.api.salvarSaldoBase({ dataReferencia: v.dataReferencia, saldo: v.saldo!, versao: this.base()?.versao ?? null })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.salvando.set(false); this.form.enable({ emitEvent: false }); }))
      .subscribe({
        next: b => { this.base.set(b); this.carregado.emit(b); this.salvo.emit(b); this.visivel = false; this.eventos.invalidar(); },
        error: (e: HttpErrorResponse) => {
          this.erro.set(mensagemApi(e));
          if (e.status === 409) {
            // A primeira requisição já terminou; apenas uma leitura de recuperação, nunca outro PUT.
            this.salvando.set(false); this.carregar(true, true);
          }
        },
      });
  }
}
