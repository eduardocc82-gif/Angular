import { Component, EventEmitter, Input, Output } from '@angular/core';

import { RecordFilters } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-filter-bar',
  standalone: false,
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  // O pai envia as opções e o estado atual por @Input.
  @Input() months: string[] = [];
  @Input() categories: string[] = [];
  @Input() showTypeFilter = true;
  @Input() filters: RecordFilters = { month: 'todos', category: 'todas', type: 'todos' };

  // O filho avisa mudanças por @Output para o pai recalcular a tabela.
  @Output() filtersChange = new EventEmitter<RecordFilters>();

  constructor(private readonly finance: Finance) {}

  // Etiqueta amigável para o select de mês.
  monthLabel(monthKey: string): string {
    return this.finance.formatMonthLabel(monthKey);
  }

  // Emite um objeto novo para evitar mutação silenciosa do estado pai.
  updateFilter(field: keyof RecordFilters, value: string): void {
    this.filtersChange.emit({
      ...this.filters,
      [field]: value,
    });
  }
}
