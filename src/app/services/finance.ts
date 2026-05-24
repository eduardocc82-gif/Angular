import { Injectable, inject } from '@angular/core';

import {
  CategoryMap,
  ExpenseBalanceResult,
  FinanceSettingsConfig,
  FinancialRecord,
  NewFinancialRecord,
  ProfileConfig,
  ProjectionResult,
  RecordFilters,
  SummaryTotals,
  TransactionType,
} from '../models/finance.models';
import { FinanceCalculations } from './finance-calculations';
import { FinanceCategories } from './finance-categories';
import { FinanceProfiles } from './finance-profiles';
import { FinanceRecords } from './finance-records';
import { FinanceSettings } from './finance-settings';

@Injectable({
  providedIn: 'root',
})
export class Finance {
  private readonly records = inject(FinanceRecords);
  private readonly profiles = inject(FinanceProfiles);
  private readonly categoriesService = inject(FinanceCategories);
  private readonly calculations = inject(FinanceCalculations);
  private readonly settings = inject(FinanceSettings);

  // Categorias publicas mantidas para compatibilidade com usos existentes.
  readonly categories: CategoryMap = this.categoriesService.categories;

  // Observables publicos mantidos para as paginas assinarem os mesmos streams.
  readonly records$ = this.records.records$;
  readonly profiles$ = this.profiles.profiles$;
  readonly selectedProfileId$ = this.profiles.selectedProfileId$;
  readonly settings$ = this.settings.settings$;

  /** Exposicao sincrona para paginas calcularem getters sem duplicar estado. */
  get recordsSnapshot(): FinancialRecord[] {
    return this.records.recordsSnapshot;
  }

  /** Exposicao sincrona dos perfis configuraveis. */
  get profilesSnapshot(): ProfileConfig[] {
    return this.profiles.profilesSnapshot;
  }

  /** Perfil ativo resolvido a partir do ID persistido. */
  get selectedProfile(): ProfileConfig {
    return this.profiles.selectedProfile;
  }

  /** Exposicao sincrona das configuracoes gerais. */
  get settingsSnapshot(): FinanceSettingsConfig {
    return this.settings.settingsSnapshot;
  }

  /** Limite configurado para o card de balanceamento das despesas. */
  get expenseBalanceThresholdPercentage(): number {
    return this.settings.expenseBalanceThresholdPercentage;
  }

  /** Adiciona registro com ID obrigatorio gerado por crypto.randomUUID(). */
  addRecord(record: NewFinancialRecord): void {
    this.records.addRecord(record);
  }

  /** Registra um aporte e a saida correspondente da carteira. */
  registerInvestment(record: NewFinancialRecord): void {
    this.records.addRecord({ ...record, type: 'investimento' });
    this.records.addRecord({
      category: 'Aplicação Investimento',
      date: record.date,
      description: 'Saída Investimento',
      type: 'saida',
      value: record.value,
    });
  }

  /** Registra uma entrada de resgate e remove o aporte selecionado. */
  redeemInvestment(recordId: string, redemptionDate = this.getLocalDateKey()): boolean {
    const investment = this.records.recordsSnapshot.find(
      (record) => record.id === recordId && record.type === 'investimento',
    );

    if (!investment) {
      return false;
    }

    this.records.addRecord({
      category: 'Resgate investimento',
      date: redemptionDate,
      description: 'Entrada Investimento',
      type: 'entrada',
      value: investment.value,
    });
    this.records.deleteRecord(investment.id);

    return true;
  }

  /** Remove um lancamento e propaga a mudanca para todos os componentes. */
  deleteRecord(recordId: string): void {
    this.records.deleteRecord(recordId);
  }

  /** Troca o perfil ativo usado no calculo de metas. */
  selectProfile(profileId: ProfileConfig['id']): void {
    this.profiles.selectProfile(profileId);
  }

  /** Atualiza percentual configuravel mantendo nome e descricao do perfil. */
  updateProfile(profileId: ProfileConfig['id'], percentage: number): void {
    this.profiles.updateProfile(profileId, percentage);
  }

  /** Atualiza o percentual de concentracao maxima por categoria de despesa. */
  updateExpenseBalanceThreshold(percentage: number): void {
    this.settings.updateExpenseBalanceThreshold(percentage);
  }

  /** Reaplica o mock inicial, util para apresentacoes e testes manuais. */
  resetDemoData(): void {
    this.records.resetDemoData();
    this.profiles.resetDemoData();
    this.settings.resetDemoData();
  }

  /** Retorna categorias conforme o tipo selecionado no formulario. */
  getCategoriesForType(type: TransactionType): string[] {
    return this.categoriesService.getCategoriesForType(type);
  }

  /** Gera uma lista unica de categorias para filtros em select-option. */
  getAllCategories(): string[] {
    return this.categoriesService.getAllCategories();
  }

  /** Filtra por mes, categoria e tipo e devolve os lancamentos em data crescente. */
  filterRecords(records: FinancialRecord[], filters: RecordFilters): FinancialRecord[] {
    return this.calculations.filterRecords(records, filters);
  }

  /** Soma entradas, saidas, investimentos e saldo para o periodo recebido. */
  calculateTotals(records: FinancialRecord[]): SummaryTotals {
    return this.calculations.calculateTotals(records);
  }

  /** Calcula o saldo acumulado da carteira ate hoje ou uma data informada. */
  calculateWalletBalanceUntil(records: FinancialRecord[], limitDateKey?: string): number {
    return this.calculations.calculateWalletBalanceUntil(records, limitDateKey);
  }

  /** Soma aportes de investimento ate hoje ou uma data informada. */
  calculateInvestedUntil(records: FinancialRecord[], limitDateKey?: string): number {
    return this.calculations.calculateInvestedUntil(records, limitDateKey);
  }

  /** Calcula limite, status e margem diaria restante ate o fim do mes. */
  calculateProjection(records: FinancialRecord[], profile: ProfileConfig): ProjectionResult {
    return this.calculations.calculateProjection(records, profile);
  }

  /** Calcula se as despesas do periodo estao bem balanceadas por categoria. */
  calculateExpenseBalance(
    records: FinancialRecord[],
    thresholdPercentage = this.settings.expenseBalanceThresholdPercentage,
  ): ExpenseBalanceResult {
    return this.calculations.calculateExpenseBalance(records, thresholdPercentage);
  }

  /** Disponibiliza meses existentes e o mes atual para os selects. */
  listAvailableMonths(records: FinancialRecord[]): string[] {
    return this.calculations.listAvailableMonths(records);
  }

  /** Chave YYYY-MM do mes corrente. */
  get currentMonthKey(): string {
    return this.calculations.currentMonthKey;
  }

  /** Formata YYYY-MM para uma etiqueta legivel em portugues. */
  formatMonthLabel(monthKey: string): string {
    return this.calculations.formatMonthLabel(monthKey);
  }

  /** Valida a regra: receitas e despesas nao podem ter data futura. */
  isFutureDate(dateValue: string): boolean {
    return this.calculations.isFutureDate(dateValue);
  }

  private getLocalDateKey(date = new Date()): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
  }
}
