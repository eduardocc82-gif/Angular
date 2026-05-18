import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

import { FinancialRecord, ProfileConfig, ProjectionResult, SummaryTotals } from '../../models/finance.models';
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

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Assina dados financeiros e perfil ativo.
  ngOnInit(): void {
    this.subscription = combineLatest([
      this.finance.records$,
      this.finance.profiles$,
      this.finance.selectedProfileId$,
    ]).subscribe(([records, profiles, selectedProfileId]) => {
      this.records = records;
      this.profiles = profiles;
      this.selectedProfileId = selectedProfileId;
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

  // Seleciona um perfil e persiste no Service.
  selectProfile(profileId: ProfileConfig['id']): void {
    this.finance.selectProfile(profileId);
  }
}
