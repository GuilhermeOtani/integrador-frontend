import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/** Ação de registro: nome acessível obrigatório, aparência única e nenhum texto visível. */
@Component({
  selector: 'app-acao-tabela', standalone: true,
  imports: [ButtonModule, TooltipModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="app-acao-tooltip" [pTooltip]="tooltip() || ariaLabel()" [tooltipPosition]="tooltipPosition()">
    <p-button type="button" [icon]="icon()" [ariaLabel]="ariaLabel()" [severity]="severity()"
      [rounded]="true" [outlined]="true" [disabled]="disabled() || loading()" [loading]="loading()"
      (onClick)="acionar($event)" />
  </span>`,
  styles: ':host,.app-acao-tooltip { display:inline-flex; vertical-align:middle; flex-shrink:0; }',
})
export class AcaoTabela {
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly tooltip = input<string>();
  readonly tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  readonly severity = input<'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'>('primary');
  readonly disabled = input(false); readonly loading = input(false);
  readonly onAction = output<MouseEvent>({ alias: 'acionar' });
  acionar(evento: MouseEvent): void { if (!this.disabled() && !this.loading()) this.onAction.emit(evento); }
}
