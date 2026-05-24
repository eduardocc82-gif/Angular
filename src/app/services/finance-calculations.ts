import { Injectable } from '@angular/core';

import {
  ExpenseBalanceResult,
  FinancialRecord,
  ProfileConfig,
  ProjectionResult,
  RecordFilters,
  SummaryTotals,
} from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class FinanceCalculations {
  private readonly investmentApplicationCategory = 'Aplicação Investimento';

  /** Filtra por mes, categoria e tipo e devolve os lancamentos em data crescente. */
  filterRecords(records: FinancialRecord[], filters: RecordFilters): FinancialRecord[] {
    return records
      .filter((record) => {
        const sameMonth =
          filters.month === 'todos' || this.getMonthKey(record.date) === filters.month;
        const sameCategory = filters.category === 'todas' || record.category === filters.category;
        const sameType = filters.type === 'todos' || record.type === filters.type;

        return sameMonth && sameCategory && sameType;
      })
      .sort((currentRecord, nextRecord) => {
        const dateOrder = currentRecord.date.localeCompare(nextRecord.date);

        if (dateOrder !== 0) {
          return dateOrder;
        }

        return currentRecord.description.localeCompare(nextRecord.description, 'pt-BR');
      });
  }

  /** Soma entradas, saidas, investimentos e saldo para o periodo recebido. */
  calculateTotals(records: FinancialRecord[]): SummaryTotals {
    return records.reduce<SummaryTotals>(
      (totals, record) => {
        if (record.type === 'entrada') {
          totals.entradas += record.value;
        }

        if (record.type === 'saida') {
          totals.saidas += record.value;
        }

        if (record.type === 'investimento') {
          totals.investimentos += record.value;
        }

        totals.saldo = totals.entradas - totals.saidas;
        return totals;
      },
      { entradas: 0, saidas: 0, investimentos: 0, saldo: 0 },
    );
  }

  /** Calcula o saldo acumulado da carteira ate uma data limite. */
  calculateWalletBalanceUntil(
    records: FinancialRecord[],
    limitDateKey = this.getLocalDateKey(),
  ): number {
    return records
      .filter(
        (record) =>
          record.date <= limitDateKey && (record.type === 'entrada' || record.type === 'saida'),
      )
      .reduce((balance, record) => {
        if (record.type === 'entrada') {
          return balance + record.value;
        }

        return balance - record.value;
      }, 0);
  }

  /** Soma todos os aportes de investimento ate uma data limite. */
  calculateInvestedUntil(
    records: FinancialRecord[],
    limitDateKey = this.getLocalDateKey(),
  ): number {
    return records
      .filter((record) => record.type === 'investimento' && record.date <= limitDateKey)
      .reduce((total, record) => total + record.value, 0);
  }

  /** Calcula limite, status e margem diaria restante ate o fim do mes. */
  calculateProjection(records: FinancialRecord[], profile: ProfileConfig): ProjectionResult {
    const totals = this.calculateTotals(records);
    const limit = totals.entradas * (profile.percentage / 100);
    const spent = this.sumGoalExpenses(records);
    const spentPercentageOfIncome = totals.entradas > 0 ? (spent / totals.entradas) * 100 : 0;
    const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
    const daysRemaining = this.getRemainingDaysInMonth();
    const dailyMargin = (limit - spent) / daysRemaining;

    if (spent <= limit * 0.8) {
      return {
        limit,
        spent,
        spentPercentageOfIncome,
        usagePercent,
        dailyMargin,
        status: 'positiva',
        message: 'Positiva: gastos dentro da margem planejada.',
      };
    }

    if (spent <= limit) {
      return {
        limit,
        spent,
        spentPercentageOfIncome,
        usagePercent,
        dailyMargin,
        status: 'alerta',
        message: 'Alerta: gastos próximos ao limite do perfil.',
      };
    }

    return {
      limit,
      spent,
      spentPercentageOfIncome,
      usagePercent,
      dailyMargin,
      status: 'negativa',
      message: 'Negativa: meta de gastos ultrapassada.',
    };
  }

  /** Avalia se alguma categoria de despesa ultrapassa o limite configurado. */
  calculateExpenseBalance(
    records: FinancialRecord[],
    thresholdPercentage = 50,
  ): ExpenseBalanceResult {
    const totals = this.calculateTotals(records);
    const normalizedThresholdPercentage =
      this.normalizeExpenseBalanceThreshold(thresholdPercentage);
    const thresholdRate = normalizedThresholdPercentage / 100;
    const limitValue = totals.entradas * thresholdRate;
    const expensesByCategory = this.sumExpensesByCategory(records);
    const highestExpenseCategory = Array.from(expensesByCategory.entries()).sort(
      (currentExpense, nextExpense) => nextExpense[1] - currentExpense[1],
    )[0];
    const largestExpense = this.findLargestExpense(records);
    const largestExpenseResult = largestExpense
      ? {
          category: largestExpense.category,
          description: largestExpense.description,
          percentageOfIncome:
            totals.entradas > 0 ? (largestExpense.value / totals.entradas) * 100 : 100,
          value: largestExpense.value,
        }
      : undefined;

    if (!highestExpenseCategory || highestExpenseCategory[1] <= limitValue) {
      return {
        status: 'positiva',
        largestExpense: largestExpenseResult,
        limitValue,
        message: 'Você está gastando suas despesas mensais bem balanceada.',
        thresholdPercentage: normalizedThresholdPercentage,
      };
    }

    const [category, value] = highestExpenseCategory;
    const percentageOfIncome = totals.entradas > 0 ? (value / totals.entradas) * 100 : 100;

    return {
      status: 'negativa',
      category,
      categoryExpenseValue: value,
      largestExpense: largestExpenseResult,
      limitValue,
      percentageOfIncome,
      message: 'Suas despesas mensais estão desbalanceadas.',
      thresholdPercentage: normalizedThresholdPercentage,
    };
  }

  /** Disponibiliza meses existentes e o mes atual para os selects. */
  listAvailableMonths(records: FinancialRecord[]): string[] {
    const monthKeys = new Set<string>([this.currentMonthKey]);
    records.forEach((record) => monthKeys.add(this.getMonthKey(record.date)));

    return Array.from(monthKeys).sort().reverse();
  }

  /** Chave YYYY-MM do mes corrente. */
  get currentMonthKey(): string {
    return this.getMonthKey(new Date().toISOString());
  }

  /** Formata YYYY-MM para uma etiqueta legivel em portugues. */
  formatMonthLabel(monthKey: string): string {
    if (monthKey === 'todos') {
      return 'Todos os meses';
    }

    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  }

  /** Valida a regra: receitas e despesas nao podem ter data futura. */
  isFutureDate(dateValue: string): boolean {
    const today = new Date();
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    today.setHours(0, 0, 0, 0);

    return selectedDate.getTime() > today.getTime();
  }

  /** Extrai a chave YYYY-MM de uma data ISO. */
  private getMonthKey(dateValue: string): string {
    return dateValue.slice(0, 7);
  }

  /** Formata hoje como YYYY-MM-DD no fuso local. */
  private getLocalDateKey(date = new Date()): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
  }

  /** Agrupa apenas despesas por categoria para regras de concentracao de gastos. */
  private sumExpensesByCategory(records: FinancialRecord[]): Map<string, number> {
    const totals = new Map<string, number>();

    records
      .filter((record) => this.isGoalExpense(record))
      .forEach((record) =>
        totals.set(record.category, (totals.get(record.category) ?? 0) + record.value),
      );

    return totals;
  }

  /** Encontra o maior lancamento individual de despesa no periodo recebido. */
  private findLargestExpense(records: FinancialRecord[]): FinancialRecord | undefined {
    return records
      .filter((record) => this.isGoalExpense(record))
      .sort((currentRecord, nextRecord) => nextRecord.value - currentRecord.value)[0];
  }

  /** Soma despesas consideradas na meta, excluindo aplicacoes de investimento. */
  private sumGoalExpenses(records: FinancialRecord[]): number {
    return records
      .filter((record) => this.isGoalExpense(record))
      .reduce((total, record) => total + record.value, 0);
  }

  /** Identifica despesas que entram em meta e balanceamento. */
  private isGoalExpense(record: FinancialRecord): boolean {
    return (
      record.type === 'saida' &&
      record.category.trim().toLocaleLowerCase('pt-BR') !==
        this.investmentApplicationCategory.toLocaleLowerCase('pt-BR')
    );
  }

  /** Mantem compatibilidade com a faixa permitida nas configuracoes. */
  private normalizeExpenseBalanceThreshold(thresholdPercentage: number): number {
    const parsedThreshold = Number(thresholdPercentage);

    if (!Number.isFinite(parsedThreshold)) {
      return 50;
    }

    return Math.min(Math.max(parsedThreshold, 30), 100);
  }

  /** Calcula dias restantes protegendo contra divisao por zero. */
  private getRemainingDaysInMonth(): number {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remaining = endOfMonth.getDate() - today.getDate() + 1;

    return Math.max(remaining, 1);
  }
}
