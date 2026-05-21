import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';

import {
  ExpenseBalanceResult,
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
  profiles: ProfileConfig[] = [];
  selectedProfile: ProfileConfig | null = null;
  selectedProfileId: ProfileConfig['id'] = 'conservador';
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'todos' };
  expenseBalanceThresholdPercentage = 50;

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Assina registros e configurações persistidas no localStorage.
  ngOnInit(): void {
    this.filters = { ...this.filters, month: this.finance.currentMonthKey };

    this.subscription = combineLatest([
      this.finance.records$,
      this.finance.profiles$,
      this.finance.selectedProfileId$,
      this.finance.settings$,
    ]).subscribe(([records, profiles, selectedProfileId, settings]) => {
      this.records = records;
      this.profiles = profiles;
      this.selectedProfileId = selectedProfileId;
      this.selectedProfile =
        profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
      this.expenseBalanceThresholdPercentage = settings.expenseBalanceThresholdPercentage;
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

  // Saldo consolidado de entradas menos despesas registradas ate hoje.
  get walletBalanceToday(): number {
    const todayKey = this.getLocalDateKey(new Date());

    return this.records
      .filter(
        (record) =>
          record.date <= todayKey && (record.type === 'entrada' || record.type === 'saida'),
      )
      .reduce((balance, record) => {
        if (record.type === 'entrada') {
          return balance + record.value;
        }

        return balance - record.value;
      }, 0);
  }

  // Ajusta a cor do card conforme saldo positivo ou negativo.
  get walletBalanceTone(): 'green' | 'red' | 'blue' | 'yellow' {
    return this.walletBalanceToday >= 0 ? 'green' : 'red';
  }

  // Projeção atual conforme perfil selecionado.
  get projection(): ProjectionResult | null {
    return this.selectedProfile
      ? this.finance.calculateProjection(this.monthRecords, this.selectedProfile)
      : null;
  }

  // Balanceamento das despesas por categoria em relacao as entradas do periodo.
  get expenseBalance(): ExpenseBalanceResult {
    return this.finance.calculateExpenseBalance(
      this.monthRecords,
      this.expenseBalanceThresholdPercentage,
    );
  }

  // Mes usado pelo grafico de fluxo de caixa diario.
  get cashFlowMonth(): string {
    return this.filters.month === 'todos' ? this.finance.currentMonthKey : this.filters.month;
  }

  // Titulo do grafico com mes numerico para leitura rapida.
  get cashFlowTitle(): string {
    return `Fluxo de receitas e despesas, ${this.cashFlowMonthLabel}`;
  }

  // Mes numerico destacado no seletor ao lado dos cards.
  get cashFlowMonthLabel(): string {
    return this.formatNumericMonth(this.cashFlowMonth);
  }

  // Texto do periodo selecionado no topo do dashboard.
  get analysisMonthLabel(): string {
    return this.finance.formatMonthLabel(this.filters.month);
  }

  // Meses disponíveis para o select do componente filho.
  get months(): string[] {
    return this.finance.listAvailableMonths(this.records);
  }

  // Categorias disponíveis para o filtro do componente filho.
  get categories(): string[] {
    return this.finance.getAllCategories();
  }

  // Etiqueta textual para as opcoes do seletor de mes.
  monthLabel(monthKey: string): string {
    return this.finance.formatMonthLabel(monthKey);
  }

  // Recebe filtros do filho por @Output.
  updateFilters(filters: RecordFilters): void {
    this.filters = filters;
  }

  // Atualiza apenas o mes escolhido no card de periodo do topo.
  updateMonth(month: string): void {
    this.filters = {
      ...this.filters,
      month,
    };
  }

  // Seleciona o card de meta usado na projeção.
  selectProfile(profileId: ProfileConfig['id']): void {
    this.finance.selectProfile(profileId);
  }

  // Recebe exclusão da tabela por @Output.
  deleteRecord(recordId: string): void {
    this.finance.deleteRecord(recordId);
  }

  private formatNumericMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');

    return `${month}/${year}`;
  }

  private getLocalDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
  }
}
