import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { FinancialRecord, NewFinancialRecord, RecordFilters } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-lancamentos',
  standalone: false,
  templateUrl: './lancamentos.html',
  styleUrl: './lancamentos.scss',
})
export class Lancamentos implements OnInit, OnDestroy {
  // Página pai controla formulário, filtros e tabela.
  records: FinancialRecord[] = [];
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'todos' };
  successMessage = '';

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Assina a coleção persistida no Service.
  ngOnInit(): void {
    this.subscription = this.finance.records$.subscribe((records) => {
      this.records = records;
    });
  }

  // Limpa subscription da rota.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Registros filtrados para a tabela.
  get filteredRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, this.filters);
  }

  // Meses disponíveis no filtro.
  get months(): string[] {
    return this.finance.listAvailableMonths(this.records);
  }

  // Categorias disponíveis no filtro.
  get categories(): string[] {
    return this.finance.getAllCategories();
  }

  // Salva registro emitido pelo formulário filho.
  saveRecord(record: NewFinancialRecord): void {
    this.finance.addRecord(record);
    this.successMessage = 'Lançamento salvo com sucesso.';
  }

  // Atualiza filtro emitido pelo componente filho.
  updateFilters(filters: RecordFilters): void {
    this.filters = filters;
  }

  // Remove item emitido pela tabela filha.
  deleteRecord(recordId: string): void {
    this.finance.deleteRecord(recordId);
    this.successMessage = 'Lançamento removido.';
  }
}
