import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FinancialRecord } from '../../models/finance.models';

@Component({
  selector: 'app-records-table',
  standalone: false,
  templateUrl: './records-table.html',
  styleUrl: './records-table.scss',
})
export class RecordsTable {
  // Registros recebidos do componente pai por @Input.
  @Input() records: FinancialRecord[] = [];
  @Input() title = 'Lançamentos';
  @Input() compact = false;
  @Input() actionButtonClass = 'btn-outline-danger';
  @Input() actionIcon = 'bi-trash3';
  @Input() actionLabel = 'Excluir lançamento';
  @Input() actionLabelPrefix = 'Excluir';

  // Acao enviada ao pai por @Output. O nome antigo preserva compatibilidade.
  @Output() deleteRecord = new EventEmitter<string>();

  // Garante exibicao cronologica mesmo quando o pai envia registros fora de ordem.
  get sortedRecords(): FinancialRecord[] {
    return [...this.records].sort((currentRecord, nextRecord) => {
      const dateOrder = currentRecord.date.localeCompare(nextRecord.date);

      if (dateOrder !== 0) {
        return dateOrder;
      }

      return currentRecord.description.localeCompare(nextRecord.description, 'pt-BR');
    });
  }

  // Identificador estável para renderização eficiente da tabela.
  trackById(_index: number, record: FinancialRecord): string {
    return record.id;
  }

  // Converte o tipo interno em texto amigável.
  typeLabel(type: FinancialRecord['type']): string {
    const labels = {
      entrada: 'Entrada',
      saida: 'Saída',
      investimento: 'Investimento',
    };

    return labels[type];
  }

  // Classe visual do chip de tipo.
  typeClass(type: FinancialRecord['type']): string {
    return `type-pill type-pill--${type}`;
  }

  // Formata data ISO como data local para evitar deslocamento por timezone no pipe date.
  formatDate(dateValue: string): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateValue}T00:00:00`));
  }
}
