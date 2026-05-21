import { Component, Input } from '@angular/core';

import { ExpenseBalanceResult } from '../../models/finance.models';

@Component({
  selector: 'app-expense-balance',
  standalone: false,
  templateUrl: './expense-balance.html',
  styleUrl: './expense-balance.scss',
})
export class ExpenseBalance {
  // Resultado calculado pelo componente pai para manter o card apenas apresentacional.
  @Input() balance: ExpenseBalanceResult | null = null;

  /** Classe visual baseada no status do balanceamento. */
  statusClass(): string {
    return `expense-balance--${this.balance?.status ?? 'positiva'}`;
  }

  /** Icone de status no mesmo padrao visual da projecao de meta. */
  statusIcon(): string {
    const icons = {
      positiva: 'bi-check-circle',
      negativa: 'bi-x-circle',
    };

    return icons[this.balance?.status ?? 'positiva'];
  }

  /** Percentual exibido com duas casas decimais no padrao brasileiro. */
  formattedPercentage(): string {
    return (this.balance?.percentageOfIncome ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
