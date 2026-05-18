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

@Component({
  selector: 'app-chart-panel',
  standalone: false,
  templateUrl: './chart-panel.html',
  styleUrl: './chart-panel.scss',
})
export class ChartPanel implements AfterViewInit, OnChanges, OnDestroy {
  // O pai informa os dados e o tipo de visualização por @Input.
  @Input() records: FinancialRecord[] = [];
  @Input() mode: 'category' | 'monthly' = 'category';
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
  }

  // Escolhe a configuração adequada e recria o canvas.
  private renderChart(): void {
    if (!this.viewReady || !this.chartCanvas) {
      return;
    }

    this.chart?.destroy();
    const context = this.chartCanvas.nativeElement.getContext('2d');
    const config = this.mode === 'category' ? this.buildCategoryChart() : this.buildMonthlyChart();

    this.hasData = config.data.datasets.some((dataset) => (dataset.data as number[]).some((value) => value > 0));

    if (!context || !this.hasData) {
      return;
    }

    this.chart = new Chart(context, config);
  }

  // Gráfico de despesas por categoria para atender ao requisito de Chart.js.
  private buildCategoryChart(): ChartConfiguration {
    const expenseRecords = this.records.filter((record) => record.type === 'saida');
    const grouped = this.sumByCategory(expenseRecords);

    return {
      type: 'doughnut',
      data: {
        labels: grouped.labels,
        datasets: [
          {
            data: grouped.values,
            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#64748b'],
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

  // Agrupa despesas por categoria.
  private sumByCategory(records: FinancialRecord[]): { labels: string[]; values: number[] } {
    const totals = new Map<string, number>();
    records.forEach((record) => totals.set(record.category, (totals.get(record.category) ?? 0) + record.value));

    return {
      labels: Array.from(totals.keys()),
      values: Array.from(totals.values()),
    };
  }

  // Agrupa os seis meses mais recentes existentes no conjunto de registros.
  private sumByMonth(records: FinancialRecord[]): { labels: string[]; entradas: number[]; saidas: number[] } {
    const totals = new Map<string, { entrada: number; saida: number }>();

    records.forEach((record) => {
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

  // Formata valor em real para tooltip e eixo.
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
  }

  // Converte YYYY-MM em mês abreviado para gráfico.
  private formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1, 1));
  }
}
