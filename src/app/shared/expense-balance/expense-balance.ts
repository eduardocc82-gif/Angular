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

  /** Valor limite atual para a categoria mais concentrada. */
  formattedLimitValue(): string {
    return this.formatCurrency(this.balance?.limitValue ?? 0);
  }

  /** Valor total gasto na categoria que ultrapassou o limite. */
  formattedCategoryExpenseValue(): string {
    return this.formatCurrency(this.balance?.categoryExpenseValue ?? 0);
  }

  /** Percentual limite configurado para o balanceamento. */
  formattedThresholdPercentage(): string {
    return (this.balance?.thresholdPercentage ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Valor da maior despesa individual do mes. */
  formattedLargestExpenseValue(): string {
    return this.formatCurrency(this.balance?.largestExpense?.value ?? 0);
  }

  /** Percentual da maior despesa individual sobre as receitas do mes. */
  formattedLargestExpensePercentage(): string {
    return (this.balance?.largestExpense?.percentageOfIncome ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
  }
}
