import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { FinanceSettingsConfig } from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class FinanceSettings {
  // Chave versionada para preferencias gerais do usuario.
  private readonly settingsKey = 'controle-financeiro-angular.settings.v1';

  private readonly defaultSettings: FinanceSettingsConfig = {
    expenseBalanceThresholdPercentage: 50,
  };

  private readonly settingsSubject = new BehaviorSubject<FinanceSettingsConfig>(
    this.loadSettings(),
  );

  readonly settings$ = this.settingsSubject.asObservable();

  /** Exposicao sincrona das configuracoes gerais. */
  get settingsSnapshot(): FinanceSettingsConfig {
    return this.settingsSubject.value;
  }

  /** Percentual maximo permitido para uma categoria antes do alerta. */
  get expenseBalanceThresholdPercentage(): number {
    return this.settingsSubject.value.expenseBalanceThresholdPercentage;
  }

  /** Atualiza limite de balanceamento mantendo o valor entre 30% e 100%. */
  updateExpenseBalanceThreshold(percentage: number): void {
    const updatedSettings: FinanceSettingsConfig = {
      ...this.settingsSubject.value,
      expenseBalanceThresholdPercentage: this.normalizePercentage(percentage),
    };

    localStorage.setItem(this.settingsKey, JSON.stringify(updatedSettings));
    this.settingsSubject.next(updatedSettings);
  }

  /** Restaura o percentual da demo para 50%. */
  resetDemoData(): void {
    localStorage.removeItem(this.settingsKey);
    this.settingsSubject.next({ ...this.defaultSettings });
  }

  /** Carrega preferencias salvas protegendo contra dados antigos ou invalidos. */
  private loadSettings(): FinanceSettingsConfig {
    try {
      const storedSettings = localStorage.getItem(this.settingsKey);
      if (!storedSettings) {
        return { ...this.defaultSettings };
      }

      const parsedSettings = JSON.parse(storedSettings) as Partial<FinanceSettingsConfig>;

      return {
        ...this.defaultSettings,
        ...parsedSettings,
        expenseBalanceThresholdPercentage: this.normalizePercentage(
          parsedSettings.expenseBalanceThresholdPercentage,
        ),
      };
    } catch {
      return { ...this.defaultSettings };
    }
  }

  /** Normaliza o percentual para a faixa aceita pela regra de negocio. */
  private normalizePercentage(percentage: unknown): number {
    const parsedPercentage = Number(percentage);

    if (!Number.isFinite(parsedPercentage)) {
      return this.defaultSettings.expenseBalanceThresholdPercentage;
    }

    return Math.min(Math.max(parsedPercentage, 30), 100);
  }
}
