import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { FinancialRecord, RecordFilters } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-relatorios',
  standalone: false,
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.scss',
})
export class Relatorios implements OnInit, OnDestroy {
  // Estado dos filtros usados para montar o relatorio imprimivel.
  records: FinancialRecord[] = [];
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'todos' };
  message = '';

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  ngOnInit(): void {
    this.filters = { ...this.filters, month: this.finance.currentMonthKey };

    this.subscription = this.finance.records$.subscribe((records) => {
      this.records = records;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get months(): string[] {
    return this.finance.listAvailableMonths(this.records);
  }

  get filteredRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, this.filters);
  }

  monthLabel(monthKey: string): string {
    return this.finance.formatMonthLabel(monthKey);
  }

  updateFilter(field: 'month' | 'type', value: string): void {
    this.message = '';
    this.filters = {
      ...this.filters,
      [field]: value,
    };
  }

  async generatePdf(): Promise<void> {
    const records = this.filteredRecords;

    if (records.length === 0) {
      this.message = 'Nenhum lançamento encontrado para gerar o relatório.';
      return;
    }

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const document = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const createdAt = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date());

      document.setFont('helvetica', 'bold');
      document.setFontSize(18);
      document.text('Relatório de lançamentos financeiros', 40, 42);

      document.setFont('helvetica', 'normal');
      document.setFontSize(10);
      document.text(`Período: ${this.monthLabel(this.filters.month)}`, 40, 64);
      document.text(`Tipo: ${this.typeLabel(this.filters.type)}`, 260, 64);
      document.text(`Gerado em: ${createdAt}`, 460, 64);

      autoTable(document, {
        startY: 84,
        head: [['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor']],
        body: records.map((record) => [
          this.formatDate(record.date),
          record.description,
          this.typeLabel(record.type),
          record.category,
          this.formatCurrency(record.value),
        ]),
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: [17, 24, 39],
          textColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 250 },
          2: { cellWidth: 105 },
          3: { cellWidth: 145 },
          4: { halign: 'right', cellWidth: 110 },
        },
        didParseCell: (data) => {
          if (data.section !== 'body') {
            return;
          }

          const record = records[data.row.index];
          if (!record) {
            return;
          }

          const colors = this.pdfColors(record.type);
          data.cell.styles.fillColor = colors.background;

          if (data.column.index === 4) {
            data.cell.styles.fillColor = colors.fill;
            data.cell.styles.textColor = colors.text;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'right';
          }
        },
        didDrawPage: () => {
          const pageCount = document.getNumberOfPages();
          document.setFont('helvetica', 'normal');
          document.setFontSize(8);
          document.text(`Página ${pageCount}`, document.internal.pageSize.getWidth() - 80, 575);
        },
      });

      const fileName = `relatorio-lancamentos-${this.filters.month}-${this.filters.type}.pdf`;
      const pdfUrl = URL.createObjectURL(document.output('blob'));
      const openedWindow = window.open(pdfUrl, '_blank');
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

      if (!openedWindow) {
        document.save(fileName);
        this.message = 'PDF gerado. Abra o arquivo baixado para imprimir.';
        return;
      }

      this.message = 'PDF gerado em uma nova aba para impressão.';
    } catch {
      this.message = 'Não foi possível gerar o PDF. Tente novamente em instantes.';
    }
  }

  typeLabel(type: FinancialRecord['type'] | 'todos'): string {
    const labels = {
      todos: 'Todos os tipos',
      entrada: 'Entrada',
      saida: 'Saída',
      investimento: 'Investimento',
    };

    return labels[type];
  }

  typeClass(type: FinancialRecord['type']): string {
    return `type-pill type-pill--${type}`;
  }

  valueClass(type: FinancialRecord['type']): string {
    return `relatorios-page__value relatorios-page__value--${type}`;
  }

  trackById(_index: number, record: FinancialRecord): string {
    return record.id;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      currency: 'BRL',
      style: 'currency',
    }).format(value);
  }

  formatDate(dateValue: string): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateValue}T00:00:00`));
  }

  private pdfColors(type: FinancialRecord['type']): {
    background: [number, number, number];
    fill: [number, number, number];
    text: [number, number, number];
  } {
    const colors = {
      entrada: {
        background: [236, 253, 245],
        fill: [16, 185, 129],
        text: [4, 120, 87],
      },
      saida: {
        background: [254, 242, 242],
        fill: [239, 68, 68],
        text: [127, 29, 29],
      },
      investimento: {
        background: [255, 251, 235],
        fill: [245, 158, 11],
        text: [120, 53, 15],
      },
    };

    return colors[type] as {
      background: [number, number, number];
      fill: [number, number, number];
      text: [number, number, number];
    };
  }
}
