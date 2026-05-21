import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

import {
  ExpenseBalanceResult,
  FinancialRecord,
  ProfileConfig,
  ProjectionResult,
  SummaryTotals,
} from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-metas',
  standalone: false,
  templateUrl: './metas.html',
  styleUrl: './metas.scss',
})
export class Metas implements OnInit, OnDestroy {
  // Estado usado para comparar perfis e calcular a margem diária.
  records: FinancialRecord[] = [];
  profiles: ProfileConfig[] = [];
  selectedProfileId: ProfileConfig['id'] = 'conservador';
  expenseBalanceThresholdPercentage = 50;

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Assina dados financeiros e perfil ativo.
  ngOnInit(): void {
    this.subscription = combineLatest([
      this.finance.records$,
      this.finance.profiles$,
      this.finance.selectedProfileId$,
      this.finance.settings$,
    ]).subscribe(([records, profiles, selectedProfileId, settings]) => {
      this.records = records;
      this.profiles = profiles;
      this.selectedProfileId = selectedProfileId;
      this.expenseBalanceThresholdPercentage = settings.expenseBalanceThresholdPercentage;
    });
  }

  // Libera subscription quando sai da rota.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Registros do mês atual, base de cálculo das metas.
  get currentMonthRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, {
      month: this.finance.currentMonthKey,
      category: 'todas',
      type: 'todos',
    });
  }

  // Perfil ativo selecionado pelo usuário.
  get selectedProfile(): ProfileConfig | null {
    return this.profiles.find((profile) => profile.id === this.selectedProfileId) ?? null;
  }

  // Totais para contextualizar a meta.
  get summary(): SummaryTotals {
    return this.finance.calculateTotals(this.currentMonthRecords);
  }

  // Resultado da projeção exibido no componente filho.
  get projection(): ProjectionResult | null {
    return this.selectedProfile
      ? this.finance.calculateProjection(this.currentMonthRecords, this.selectedProfile)
      : null;
  }

  // Balanceamento das despesas por categoria em relacao as entradas do mes atual.
  get expenseBalance(): ExpenseBalanceResult {
    return this.finance.calculateExpenseBalance(
      this.currentMonthRecords,
      this.expenseBalanceThresholdPercentage,
    );
  }

  // Seleciona um perfil e persiste no Service.
  selectProfile(profileId: ProfileConfig['id']): void {
    this.finance.selectProfile(profileId);
  }
}
