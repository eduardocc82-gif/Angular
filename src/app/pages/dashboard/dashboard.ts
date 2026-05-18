import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

import {
  FinancialRecord,
  ProfileConfig,
  ProjectionResult,
  RecordFilters,
  SummaryTotals,
} from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  // Estado da página pai que alimenta os filhos por @Input.
  records: FinancialRecord[] = [];
  selectedProfile: ProfileConfig | null = null;
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'todos' };

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Assina registros e configurações persistidas no localStorage.
  ngOnInit(): void {
    this.filters = { ...this.filters, month: this.finance.currentMonthKey };

    this.subscription = combineLatest([
      this.finance.records$,
      this.finance.profiles$,
      this.finance.selectedProfileId$,
    ]).subscribe(([records, profiles, selectedProfileId]) => {
      this.records = records;
      this.selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
    });
  }

  // Evita subscriptions penduradas quando a rota muda.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Registros filtrados para tabela e gráfico de categorias.
  get filteredRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, this.filters);
  }

  // Registros do mês selecionado usados nos cards e metas.
  get monthRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, {
      month: this.filters.month,
      category: 'todas',
      type: 'todos',
    });
  }

  // Totais consolidados do painel resumo.
  get summary(): SummaryTotals {
    return this.finance.calculateTotals(this.monthRecords);
  }

  // Projeção atual conforme perfil selecionado.
  get projection(): ProjectionResult | null {
    return this.selectedProfile ? this.finance.calculateProjection(this.monthRecords, this.selectedProfile) : null;
  }

  // Meses disponíveis para o select do componente filho.
  get months(): string[] {
    return this.finance.listAvailableMonths(this.records);
  }

  // Categorias disponíveis para o filtro do componente filho.
  get categories(): string[] {
    return this.finance.getAllCategories();
  }

  // Recebe filtros do filho por @Output.
  updateFilters(filters: RecordFilters): void {
    this.filters = filters;
  }

  // Recebe exclusão da tabela por @Output.
  deleteRecord(recordId: string): void {
    this.finance.deleteRecord(recordId);
  }
}
