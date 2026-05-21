import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

import { ProfileConfig } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-configuracoes',
  standalone: false,
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.scss',
})
export class Configuracoes implements OnInit, OnDestroy {
  // Perfis configuráveis carregados do Service.
  profiles: ProfileConfig[] = [];
  selectedProfileId: ProfileConfig['id'] = 'conservador';
  draftPercentages: Record<string, number> = {};
  draftExpenseBalanceThresholdPercentage = 50;
  message = '';

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Mantém a tela sincronizada com localStorage.
  ngOnInit(): void {
    this.subscription = combineLatest([
      this.finance.profiles$,
      this.finance.selectedProfileId$,
      this.finance.settings$,
    ]).subscribe(([profiles, selectedProfileId, settings]) => {
      this.profiles = profiles;
      this.selectedProfileId = selectedProfileId;
      this.draftExpenseBalanceThresholdPercentage = settings.expenseBalanceThresholdPercentage;
      profiles.forEach((profile) => {
        this.draftPercentages[profile.id] = this.draftPercentages[profile.id] ?? profile.percentage;
      });
    });
  }

  // Evita vazamento de subscription.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Persiste o percentual alterado no Service.
  saveProfile(profile: ProfileConfig): void {
    const percentage = this.draftPercentages[profile.id] ?? profile.percentage;
    this.finance.updateProfile(profile.id, percentage);
    this.message = `Perfil ${profile.label} atualizado.`;
  }

  // Persiste o limite usado para marcar despesas como desbalanceadas.
  saveExpenseBalanceThreshold(): void {
    this.finance.updateExpenseBalanceThreshold(this.draftExpenseBalanceThresholdPercentage);
    this.message = 'Percentual de balanceamento atualizado.';
  }

  // Atualiza o perfil ativo usado na projeção.
  selectProfile(profileId: ProfileConfig['id']): void {
    this.finance.selectProfile(profileId);
    this.message = 'Perfil ativo atualizado.';
  }

  // Restaura dados demonstrativos para avaliação do projeto.
  resetDemoData(): void {
    this.draftPercentages = {};
    this.draftExpenseBalanceThresholdPercentage = 50;
    this.finance.resetDemoData();
    this.message = 'Dados demonstrativos restaurados.';
  }
}
