import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  CategoryMap,
  FinancialRecord,
  NewFinancialRecord,
  ProfileConfig,
  ProjectionResult,
  RecordFilters,
  SummaryTotals,
  TransactionType,
} from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class Finance {
  // Chaves versionadas evitam conflito com outros projetos no localStorage.
  private readonly recordsKey = 'controle-financeiro-angular.records.v1';
  private readonly profilesKey = 'controle-financeiro-angular.profiles.v1';
  private readonly selectedProfileKey = 'controle-financeiro-angular.selected-profile.v1';

  // Categorias padrão por tipo; "Outros" fica no final como solicitado.
  readonly categories: CategoryMap = {
    entrada: ['Salário', 'Freelance', 'Reembolso', 'Rendimentos', 'Outros'],
    saida: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
    investimento: ['Tesouro Direto', 'CDB', 'Fundos', 'Ações', 'Criptomoedas', 'Outros'],
  };

  // Mock inicial usado quando o localStorage ainda está vazio.
  private readonly mockRecords: FinancialRecord[] = [
    {
      id: 'mock-entrada-salario',
      description: 'Salário mensal',
      type: 'entrada',
      category: 'Salário',
      date: this.buildDateForCurrentMonth(5),
      value: 8500,
    },
    {
      id: 'mock-despesa-moradia',
      description: 'Aluguel',
      type: 'saida',
      category: 'Moradia',
      date: this.buildDateForCurrentMonth(7),
      value: 2300,
    },
    {
      id: 'mock-despesa-mercado',
      description: 'Supermercado',
      type: 'saida',
      category: 'Alimentação',
      date: this.buildDateForCurrentMonth(10),
      value: 890.75,
    },
    {
      id: 'mock-investimento-cdb',
      description: 'Aporte CDB liquidez diária',
      type: 'investimento',
      category: 'CDB',
      date: this.buildDateForCurrentMonth(12),
      value: 1000,
    },
    {
      id: 'mock-despesa-transporte',
      description: 'Combustível',
      type: 'saida',
      category: 'Transporte',
      date: this.buildDateForCurrentMonth(14),
      value: 420.5,
    },
    {
      id: 'mock-entrada-freela',
      description: 'Projeto freelance',
      type: 'entrada',
      category: 'Freelance',
      date: this.buildDateForCurrentMonth(18),
      value: 1600,
    },
  ];

  // Perfis iniciais seguem exatamente os percentuais do documento.
  private readonly defaultProfiles: ProfileConfig[] = [
    {
      id: 'leve',
      label: 'Leve',
      percentage: 90,
      description: 'Permite gastar até 90% das entradas do mês.',
    },
    {
      id: 'conservador',
      label: 'Conservador',
      percentage: 50,
      description: 'Permite gastar até 50% das entradas do mês.',
    },
    {
      id: 'arrojado',
      label: 'Arrojado',
      percentage: 40,
      description: 'Permite gastar até 40% das entradas do mês.',
    },
  ];

  // Streams simples mantêm os componentes sincronizados após salvar, excluir ou configurar.
  private readonly recordsSubject = new BehaviorSubject<FinancialRecord[]>(this.loadRecords());
  private readonly profilesSubject = new BehaviorSubject<ProfileConfig[]>(this.loadProfiles());
  private readonly selectedProfileSubject = new BehaviorSubject<ProfileConfig['id']>(
    this.loadSelectedProfileId(),
  );

  // Observables públicos usados pelas páginas.
  readonly records$ = this.recordsSubject.asObservable();
  readonly profiles$ = this.profilesSubject.asObservable();
  readonly selectedProfileId$ = this.selectedProfileSubject.asObservable();

  // Exposição síncrona para páginas calcularem getters sem duplicar estado.
  get recordsSnapshot(): FinancialRecord[] {
    return this.recordsSubject.value;
  }

  // Exposição síncrona dos perfis configuráveis.
  get profilesSnapshot(): ProfileConfig[] {
    return this.profilesSubject.value;
  }

  // Perfil ativo resolvido a partir do ID persistido.
  get selectedProfile(): ProfileConfig {
    const selectedId = this.selectedProfileSubject.value;
    return this.profilesSubject.value.find((profile) => profile.id === selectedId) ?? this.profilesSubject.value[0];
  }

  // Adiciona registro com ID obrigatório gerado por crypto.randomUUID().
  addRecord(record: NewFinancialRecord): void {
    const newRecord: FinancialRecord = {
      ...record,
      id: crypto.randomUUID(),
      value: Number(record.value),
    };

    const updatedRecords = [newRecord, ...this.recordsSubject.value];
    this.persistRecords(updatedRecords);
  }

  // Remove um lançamento e propaga a mudança para todos os componentes.
  deleteRecord(recordId: string): void {
    const updatedRecords = this.recordsSubject.value.filter((record) => record.id !== recordId);
    this.persistRecords(updatedRecords);
  }

  // Troca o perfil ativo usado no cálculo de metas.
  selectProfile(profileId: ProfileConfig['id']): void {
    localStorage.setItem(this.selectedProfileKey, profileId);
    this.selectedProfileSubject.next(profileId);
  }

  // Atualiza percentual configurável mantendo nome e descrição do perfil.
  updateProfile(profileId: ProfileConfig['id'], percentage: number): void {
    const normalizedPercentage = Math.min(Math.max(Number(percentage), 1), 100);
    const updatedProfiles = this.profilesSubject.value.map((profile) =>
      profile.id === profileId ? { ...profile, percentage: normalizedPercentage } : profile,
    );

    localStorage.setItem(this.profilesKey, JSON.stringify(updatedProfiles));
    this.profilesSubject.next(updatedProfiles);
  }

  // Reaplica o mock inicial, útil para apresentações e testes manuais.
  resetDemoData(): void {
    const resetRecords = [...this.mockRecords];
    localStorage.removeItem(this.profilesKey);
    localStorage.setItem(this.selectedProfileKey, 'conservador');
    this.persistRecords(resetRecords);
    this.profilesSubject.next([...this.defaultProfiles]);
    this.selectedProfileSubject.next('conservador');
  }

  // Retorna categorias conforme o tipo selecionado no formulário.
  getCategoriesForType(type: TransactionType): string[] {
    return this.categories[type];
  }

  // Gera uma lista única de categorias para filtros em select-option.
  getAllCategories(): string[] {
    const uniqueCategories = new Set<string>();
    (Object.values(this.categories) as string[][]).forEach((categoryList: string[]) => {
      categoryList.forEach((category: string) => uniqueCategories.add(category));
    });

    return Array.from(uniqueCategories);
  }

  // Filtra por mês, categoria e tipo, demonstrando entrada por @Input nos filhos.
  filterRecords(records: FinancialRecord[], filters: RecordFilters): FinancialRecord[] {
    return records.filter((record) => {
      const sameMonth = filters.month === 'todos' || this.getMonthKey(record.date) === filters.month;
      const sameCategory = filters.category === 'todas' || record.category === filters.category;
      const sameType = filters.type === 'todos' || record.type === filters.type;

      return sameMonth && sameCategory && sameType;
    });
  }

  // Soma entradas, saídas, investimentos e saldo para o período recebido.
  calculateTotals(records: FinancialRecord[]): SummaryTotals {
    return records.reduce<SummaryTotals>(
      (totals, record) => {
        if (record.type === 'entrada') {
          totals.entradas += record.value;
        }

        if (record.type === 'saida') {
          totals.saidas += record.value;
        }

        if (record.type === 'investimento') {
          totals.investimentos += record.value;
        }

        totals.saldo = totals.entradas - totals.saidas;
        return totals;
      },
      { entradas: 0, saidas: 0, investimentos: 0, saldo: 0 },
    );
  }

  // Calcula limite, status e margem diária restante até o fim do mês.
  calculateProjection(records: FinancialRecord[], profile: ProfileConfig): ProjectionResult {
    const totals = this.calculateTotals(records);
    const limit = totals.entradas * (profile.percentage / 100);
    const spent = totals.saidas;
    const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
    const daysRemaining = this.getRemainingDaysInMonth();
    const dailyMargin = (limit - spent) / daysRemaining;

    if (spent <= limit * 0.8) {
      return {
        limit,
        spent,
        usagePercent,
        dailyMargin,
        status: 'positiva',
        message: 'Positiva: gastos dentro da margem planejada.',
      };
    }

    if (spent <= limit) {
      return {
        limit,
        spent,
        usagePercent,
        dailyMargin,
        status: 'alerta',
        message: 'Alerta: gastos próximos ao limite do perfil.',
      };
    }

    return {
      limit,
      spent,
      usagePercent,
      dailyMargin,
      status: 'negativa',
      message: 'Negativa: meta de gastos ultrapassada.',
    };
  }

  // Disponibiliza meses existentes e o mês atual para os selects.
  listAvailableMonths(records: FinancialRecord[]): string[] {
    const monthKeys = new Set<string>([this.currentMonthKey]);
    records.forEach((record) => monthKeys.add(this.getMonthKey(record.date)));

    return Array.from(monthKeys).sort().reverse();
  }

  // Chave YYYY-MM do mês corrente.
  get currentMonthKey(): string {
    return this.getMonthKey(new Date().toISOString());
  }

  // Formata YYYY-MM para uma etiqueta legível em português.
  formatMonthLabel(monthKey: string): string {
    if (monthKey === 'todos') {
      return 'Todos os meses';
    }

    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  }

  // Valida a regra: receitas e despesas não podem ter data futura.
  isFutureDate(dateValue: string): boolean {
    const today = new Date();
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    today.setHours(0, 0, 0, 0);

    return selectedDate.getTime() > today.getTime();
  }

  // Carrega registros do localStorage ou inicializa com mock.
  private loadRecords(): FinancialRecord[] {
    const storedRecords = localStorage.getItem(this.recordsKey);
    if (!storedRecords) {
      return [...this.mockRecords];
    }

    try {
      return JSON.parse(storedRecords) as FinancialRecord[];
    } catch {
      return [...this.mockRecords];
    }
  }

  // Carrega perfis customizados ou mantém os padrões.
  private loadProfiles(): ProfileConfig[] {
    const storedProfiles = localStorage.getItem(this.profilesKey);
    if (!storedProfiles) {
      return [...this.defaultProfiles];
    }

    try {
      return JSON.parse(storedProfiles) as ProfileConfig[];
    } catch {
      return [...this.defaultProfiles];
    }
  }

  // Resolve perfil inicial persistido, com conservador como padrão.
  private loadSelectedProfileId(): ProfileConfig['id'] {
    const storedProfile = localStorage.getItem(this.selectedProfileKey) as ProfileConfig['id'] | null;
    return storedProfile ?? 'conservador';
  }

  // Persiste registros e atualiza o BehaviorSubject em um único ponto.
  private persistRecords(records: FinancialRecord[]): void {
    localStorage.setItem(this.recordsKey, JSON.stringify(records));
    this.recordsSubject.next(records);
  }

  // Extrai chave YYYY-MM de uma data ISO.
  private getMonthKey(dateValue: string): string {
    return dateValue.slice(0, 7);
  }

  // Calcula dias restantes protegendo contra divisão por zero.
  private getRemainingDaysInMonth(): number {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remaining = endOfMonth.getDate() - today.getDate() + 1;

    return Math.max(remaining, 1);
  }

  // Garante datas de mock válidas mesmo em meses com menos dias.
  private buildDateForCurrentMonth(day: number): string {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(day, endOfMonth);
    const date = new Date(today.getFullYear(), today.getMonth(), safeDay);

    return date.toISOString().slice(0, 10);
  }
}
