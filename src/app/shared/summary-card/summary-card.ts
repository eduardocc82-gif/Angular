import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  standalone: false,
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
})
export class SummaryCard {
  // Dados recebidos por @Input para comprovar a comunicação pai -> filho.
  @Input() title = '';
  @Input() value = 0;
  @Input() helper = '';
  @Input() icon = 'bi-wallet2';
  @Input() interactive = false;
  @Input() size: 'normal' | 'large' = 'normal';
  @Input() tone: 'green' | 'red' | 'blue' | 'yellow' = 'blue';
  @Output() cardClick = new EventEmitter<void>();

  activate(event?: Event): void {
    if (!this.interactive) {
      return;
    }

    event?.preventDefault();
    this.cardClick.emit();
  }
}
