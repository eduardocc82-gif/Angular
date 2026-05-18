import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { FinancialRecord, NewFinancialRecord, RecordFilters } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-investimentos',
  standalone: false,
  templateUrl: './investimentos.html',
  styleUrl: './investimentos.scss',
})
export class Investimentos implements OnInit, OnDestroy {
  // Rota dedicada apenas a aportes de investimentos.
  records: FinancialRecord[] = [];
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'investimento' };
  message = '';

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Carrega registros persistidos.
  ngOnInit(): void {
    this.subscription = this.finance.records$.subscribe((records) => {
      this.records = records;
    });
  }

  // Libera subscription quando sai da rota.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Lista apenas investimentos cadastrados.
  get investmentRecords(): FinancialRecord[] {
    return this.records.filter((record) => record.type === 'investimento');
  }

  // Investimentos filtrados por mês e categoria.
  get filteredRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, this.filters);
  }

  // Soma total de aportes filtrados.
  get totalInvested(): number {
    return this.filteredRecords.reduce((total, record) => total + record.value, 0);
  }

  // Meses disponíveis para filtro.
  get months(): string[] {
    return this.finance.listAvailableMonths(this.investmentRecords);
  }

  // Categorias específicas do módulo de investimentos.
  get categories(): string[] {
    return this.finance.getCategoriesForType('investimento');
  }

  // Salva aporte emitido pelo formulário filho.
  saveInvestment(record: NewFinancialRecord): void {
    this.finance.addRecord({ ...record, type: 'investimento' });
    this.message = 'Investimento registrado com sucesso.';
  }

  // Atualiza filtros mantendo o tipo fixo como investimento.
  updateFilters(filters: RecordFilters): void {
    this.filters = { ...filters, type: 'investimento' };
  }

  // Remove aporte selecionado na tabela.
  deleteRecord(recordId: string): void {
    this.finance.deleteRecord(recordId);
    this.message = 'Investimento removido.';
  }
}
