import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { FinancialRecord } from '../../models/finance.models';

// Registro único dos elementos Chart.js usados no dashboard.
Chart.register(...registerables);

type ChartPanelMode = 'category' | 'monthly' | 'cashflow' | 'closingBalance' | 'investmentTotal';

@Component({
  selector: 'app-chart-panel',
  standalone: false,
  templateUrl: './chart-panel.html',
  styleUrl: './chart-panel.scss',
})
export class ChartPanel implements AfterViewInit, OnChanges, OnDestroy {
  private readonly investmentTransferCategories = [
    'Aplicação Investimento',
    'Resgate investimento',
  ];

  // O pai informa os dados e o tipo de visualização por @Input.
  @Input() records: FinancialRecord[] = [];
  @Input() mode: ChartPanelMode = 'category';
  @Input() monthKey = '';
  @Input() size: 'normal' | 'large' = 'normal';
  @Input() title = 'Gráfico financeiro';

  // Canvas usado diretamente pela integração com Chart.js.
  @ViewChild('chartCanvas') private chartCanvas?: ElementRef<HTMLCanvasElement>;

  hasData = false;
  private chart: Chart | null = null;
  private viewReady = false;

  // Só renderiza depois que o canvas existe no DOM.
  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  // Atualiza o gráfico quando filtros ou registros mudam.
  ngOnChanges(_changes: SimpleChanges): void {
    this.renderChart();
  }

  // Libera recursos do Chart.js ao destruir o componente.
  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  // Escolhe a configuração adequada e recria o canvas.
  private renderChart(): void {
    if (!this.viewReady || !this.chartCanvas) {
      return;
    }

    this.chart?.destroy();
    this.chart = null;
    const context = this.chartCanvas.nativeElement.getContext('2d');
    const config = this.buildChartConfig();

    this.hasData = this.hasChartData(config);

    if (!context || !this.hasData) {
      return;
    }

    this.chart = new Chart(context, config);
  }

  // Direciona cada modo para a configuracao de grafico correspondente.
  private buildChartConfig(): ChartConfiguration {
    if (this.mode === 'monthly') {
      return this.buildMonthlyChart();
    }

    if (this.mode === 'cashflow') {
      return this.buildCashFlowChart();
    }

    if (this.mode === 'closingBalance') {
      return this.buildClosingBalanceChart();
    }

    if (this.mode === 'investmentTotal') {
      return this.buildInvestmentTotalChart();
    }

    return this.buildCategoryChart();
  }

  // Define quando vale renderizar o grafico em vez do estado vazio.
  private hasChartData(config: ChartConfiguration): boolean {
    if (this.mode === 'cashflow') {
      const selectedMonth = this.resolveMonthKey();

      return this.records.some(
        (record) =>
          record.date.slice(0, 7) === selectedMonth &&
          (record.type === 'entrada' || record.type === 'saida'),
      );
    }

    if (this.mode === 'closingBalance') {
      return this.records.some((record) => record.type === 'entrada' || record.type === 'saida');
    }

    if (this.mode === 'investmentTotal') {
      return this.records.some((record) => record.type === 'investimento');
    }

    return config.data.datasets.some((dataset) =>
      (dataset.data as number[]).some((value) => value > 0),
    );
  }

  // Gráfico de despesas por categoria para atender ao requisito de Chart.js.
  private buildCategoryChart(): ChartConfiguration {
    const expenseRecords = this.records.filter(
      (record) => record.type === 'saida' && !this.isInvestmentTransferRecord(record),
    );
    const grouped = this.sumByCategory(expenseRecords);

    return {
      type: 'doughnut',
      data: {
        labels: grouped.labels,
        datasets: [
          {
            data: grouped.values,
            backgroundColor: [
              '#ef4444',
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#8b5cf6',
              '#14b8a6',
              '#64748b',
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: ${this.formatCurrency(Number(item.raw))}`,
            },
          },
        },
        responsive: true,
      },
    };
  }

  // Grafico diario de entradas e saidas no mes selecionado.
  private buildCashFlowChart(): ChartConfiguration {
    const cashFlow = this.buildDailyIncomeExpenseFlow();
    const futureStartAnchorIndex = this.getFutureStartAnchorIndex(cashFlow.monthKey);
    const entradas = this.hideFutureValues(cashFlow.entradas, futureStartAnchorIndex);
    const saidas = this.hideFutureValues(cashFlow.saidas, futureStartAnchorIndex);

    return {
      type: 'bar',
      data: {
        labels: cashFlow.labels,
        datasets: [
          {
            label: 'Entradas',
            data: entradas,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.78)',
            borderRadius: 6,
            borderWidth: 1,
            maxBarThickness: 28,
          },
          {
            label: 'Saídas',
            data: saidas,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.78)',
            borderRadius: 6,
            borderWidth: 1,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        interaction: {
          intersect: false,
          mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${this.formatCurrency(Number(item.raw))}`,
              title: (items) => {
                const day = items[0]?.label ?? '';

                return `Dia ${day}`;
              },
            },
          },
        },
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Dia',
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Entradas e saídas',
            },
            ticks: {
              callback: (value) => this.formatCurrency(Number(value)),
            },
          },
        },
      },
    };
  }

  // Grafico de saldo acumulado anual ao fechar cada mes.
  private buildClosingBalanceChart(): ChartConfiguration {
    const closingBalance = this.buildMonthlyClosingBalance();
    const pointColors = closingBalance.months.map((month) =>
      this.isCurrentMonth(month) ? '#f59e0b' : '#2563eb',
    );

    return {
      type: 'line',
      data: {
        labels: closingBalance.labels,
        datasets: [
          {
            label: 'Saldo acumulado no período',
            data: closingBalance.values,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointHoverRadius: 7,
            pointRadius: closingBalance.months.map((month) => (this.isCurrentMonth(month) ? 6 : 4)),
            tension: 0.28,
          },
        ],
      },
      options: {
        interaction: {
          intersect: false,
          mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const monthKey = closingBalance.months[item.dataIndex];
                const status = this.isCurrentMonth(monthKey) ? ' (mês em aberto)' : '';

                return `Saldo: ${this.formatCurrency(Number(item.raw))}${status}`;
              },
            },
          },
        },
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Meses',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Saldo acumulado',
            },
            ticks: {
              callback: (value) => this.formatCurrency(Number(value)),
            },
          },
        },
      },
    };
  }

  // Grafico do total investido acumulado em todo o periodo registrado.
  private buildInvestmentTotalChart(): ChartConfiguration {
    const investmentTotal = this.buildMonthlyInvestmentTotal();
    const pointColors = investmentTotal.months.map((month) =>
      this.isCurrentMonth(month) ? '#f59e0b' : '#10b981',
    );

    return {
      type: 'line',
      data: {
        labels: investmentTotal.labels,
        datasets: [
          {
            label: 'Total investido',
            data: investmentTotal.values,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointHoverRadius: 7,
            pointRadius: investmentTotal.months.map((month) =>
              this.isCurrentMonth(month) ? 6 : 4,
            ),
            tension: 0.28,
          },
        ],
      },
      options: {
        interaction: {
          intersect: false,
          mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Investido acumulado: ${this.formatCurrency(Number(item.raw))}`,
            },
          },
        },
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Meses',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Total investido',
            },
            ticks: {
              callback: (value) => this.formatCurrency(Number(value)),
            },
          },
        },
      },
    };
  }

  // Gráfico de evolução mensal com entradas e saídas.
  private buildMonthlyChart(): ChartConfiguration {
    const grouped = this.sumByMonth(this.records);

    return {
      type: 'bar',
      data: {
        labels: grouped.labels,
        datasets: [
          {
            label: 'Entradas',
            data: grouped.entradas,
            backgroundColor: '#10b981',
            borderRadius: 8,
          },
          {
            label: 'Saídas',
            data: grouped.saidas,
            backgroundColor: '#ef4444',
            borderRadius: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${this.formatCurrency(Number(item.raw))}`,
            },
          },
        },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(Number(value)),
            },
          },
        },
      },
    };
  }

  // Calcula o saldo acumulado de todo o periodo registrado, mes a mes.
  private buildMonthlyClosingBalance(): {
    labels: string[];
    months: string[];
    values: number[];
  } {
    const totals = new Map<string, { entrada: number; saida: number }>();

    this.records
      .filter((record) => record.type === 'entrada' || record.type === 'saida')
      .forEach((record) => {
        const month = record.date.slice(0, 7);
        const current = totals.get(month) ?? { entrada: 0, saida: 0 };

        if (record.type === 'entrada') {
          current.entrada += record.value;
        }

        if (record.type === 'saida') {
          current.saida += record.value;
        }

        totals.set(month, current);
      });

    const recordedMonths = Array.from(totals.keys()).sort();
    const months =
      recordedMonths.length > 0
        ? this.listMonthsBetween(recordedMonths[0], recordedMonths[recordedMonths.length - 1])
        : [];
    let accumulatedBalance = 0;

    return {
      labels: months.map((month) => this.formatMonthWithYear(month)),
      months,
      values: months.map((month) => {
        const total = totals.get(month) ?? { entrada: 0, saida: 0 };
        accumulatedBalance += total.entrada - total.saida;

        return Number(accumulatedBalance.toFixed(2));
      }),
    };
  }

  // Calcula o total investido acumulado mes a mes no periodo completo da base.
  private buildMonthlyInvestmentTotal(): {
    labels: string[];
    months: string[];
    values: number[];
  } {
    const totals = new Map<string, number>();

    this.records
      .filter((record) => record.type === 'investimento')
      .forEach((record) => {
        const month = record.date.slice(0, 7);
        totals.set(month, (totals.get(month) ?? 0) + record.value);
      });

    const recordedMonths = this.records.map((record) => record.date.slice(0, 7)).sort();
    const months =
      recordedMonths.length > 0
        ? this.listMonthsBetween(recordedMonths[0], recordedMonths[recordedMonths.length - 1])
        : [];
    let accumulatedInvestment = 0;

    return {
      labels: months.map((month) => this.formatMonthWithYear(month)),
      months,
      values: months.map((month) => {
        accumulatedInvestment += totals.get(month) ?? 0;

        return Number(accumulatedInvestment.toFixed(2));
      }),
    };
  }

  // Gera todos os dias do mes selecionado, com totais diarios de entrada e saida.
  private buildDailyIncomeExpenseFlow(): {
    entradas: number[];
    labels: string[];
    monthKey: string;
    saidas: number[];
  } {
    const selectedMonth = this.resolveMonthKey();
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const entradasByDay = Array.from<number>({ length: daysInMonth }).fill(0);
    const saidasByDay = Array.from<number>({ length: daysInMonth }).fill(0);

    this.records
      .filter(
        (record) =>
          record.date.slice(0, 7) === selectedMonth &&
          (record.type === 'entrada' || record.type === 'saida'),
      )
      .forEach((record) => {
        const dayIndex = Number(record.date.slice(8, 10)) - 1;

        if (dayIndex < 0 || dayIndex >= daysInMonth) {
          return;
        }

        if (record.type === 'entrada') {
          entradasByDay[dayIndex] += record.value;
        }

        if (record.type === 'saida') {
          saidasByDay[dayIndex] += record.value;
        }
      });

    return {
      labels: Array.from({ length: daysInMonth }, (_value, index) => String(index + 1)),
      monthKey: selectedMonth,
      entradas: entradasByDay,
      saidas: saidasByDay,
    };
  }

  // Evita desenhar valores futuros no mes corrente.
  private hideFutureValues(
    values: number[],
    futureStartAnchorIndex: number | null,
  ): Array<number | null> {
    if (futureStartAnchorIndex === null) {
      return values;
    }

    return values.map((value, index) => (index <= futureStartAnchorIndex ? value : null));
  }

  // Pinta em amarelo o trecho futuro apenas quando ainda faltam dias no mes atual.
  private getFutureStartAnchorIndex(monthKey: string): number | null {
    const today = new Date();
    const currentMonth = this.getLocalMonthKey(today);

    if (monthKey !== currentMonth) {
      return null;
    }

    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayIndex = today.getDate() - 1;

    return today.getDate() < daysInMonth ? todayIndex : null;
  }

  // Agrupa despesas por categoria.
  private sumByCategory(records: FinancialRecord[]): { labels: string[]; values: number[] } {
    const totals = new Map<string, number>();
    records.forEach((record) =>
      totals.set(record.category, (totals.get(record.category) ?? 0) + record.value),
    );

    return {
      labels: Array.from(totals.keys()),
      values: Array.from(totals.values()),
    };
  }

  // Agrupa os seis meses mais recentes existentes no conjunto de registros.
  private sumByMonth(records: FinancialRecord[]): {
    labels: string[];
    entradas: number[];
    saidas: number[];
  } {
    const totals = new Map<string, { entrada: number; saida: number }>();

    records
      .filter((record) => !this.isInvestmentTransferRecord(record))
      .forEach((record) => {
        const month = record.date.slice(0, 7);
        const current = totals.get(month) ?? { entrada: 0, saida: 0 };

        if (record.type === 'entrada') {
          current.entrada += record.value;
        }

        if (record.type === 'saida') {
          current.saida += record.value;
        }

        totals.set(month, current);
      });

    const months = Array.from(totals.keys()).sort().slice(-6);

    return {
      labels: months.map((month) => this.formatMonth(month)),
      entradas: months.map((month) => totals.get(month)?.entrada ?? 0),
      saidas: months.map((month) => totals.get(month)?.saida ?? 0),
    };
  }

  // Lista meses consecutivos no formato YYYY-MM, incluindo inicio e fim.
  private listMonthsBetween(startMonth: string, endMonth: string): string[] {
    const [startYear, startMonthNumber] = startMonth.split('-').map(Number);
    const [endYear, endMonthNumber] = endMonth.split('-').map(Number);
    const cursor = new Date(startYear, startMonthNumber - 1, 1);
    const end = new Date(endYear, endMonthNumber - 1, 1);
    const months: string[] = [];

    while (cursor <= end) {
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      months.push(`${cursor.getFullYear()}-${month}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }

  // Resolve o mes usado por graficos dependentes de um periodo unico.
  private resolveMonthKey(): string {
    if (/^\d{4}-\d{2}$/.test(this.monthKey)) {
      return this.monthKey;
    }

    return this.getLocalMonthKey(new Date());
  }

  // Formata uma data local como YYYY-MM sem depender de conversao UTC.
  private getLocalMonthKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${date.getFullYear()}-${month}`;
  }

  // Identifica a bolinha do mes que ainda nao foi fechado.
  private isCurrentMonth(monthKey: string): boolean {
    return monthKey === this.getLocalMonthKey(new Date());
  }

  // Formata valor em real para tooltip e eixo.
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
  }

  // Converte YYYY-MM em mês abreviado para gráfico.
  private formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(
      new Date(year, month - 1, 1),
    );
  }

  // Converte YYYY-MM em mes e ano abreviados para series historicas.
  private formatMonthWithYear(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(
      new Date(year, month - 1, 1),
    );
  }

  private isInvestmentTransferRecord(record: FinancialRecord): boolean {
    const normalizedCategory = record.category.trim().toLocaleLowerCase('pt-BR');

    return this.investmentTransferCategories.some(
      (category) => category.toLocaleLowerCase('pt-BR') === normalizedCategory,
    );
  }
}
