import { TestBed } from '@angular/core/testing';

import {
  FinancialRecord,
  NewFinancialRecord,
  ProfileConfig,
  RecordFilters,
} from '../models/finance.models';
import { Finance } from './finance';

describe('Finance', () => {
  let service: Finance;

  const records: FinancialRecord[] = [
    {
      id: 'entrada-1',
      description: 'Salário',
      type: 'entrada',
      category: 'Salário',
      date: '2026-05-05',
      value: 5000,
    },
    {
      id: 'saida-1',
      description: 'Aluguel',
      type: 'saida',
      category: 'Moradia',
      date: '2026-05-06',
      value: 1500,
    },
    {
      id: 'investimento-1',
      description: 'CDB',
      type: 'investimento',
      category: 'CDB',
      date: '2026-05-07',
      value: 800,
    },
    {
      id: 'saida-2',
      description: 'Mercado',
      type: 'saida',
      category: 'Alimentação',
      date: '2026-04-10',
      value: 400,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Finance);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve calcular entradas, saídas, investimentos e saldo corretamente', () => {
    const totals = service.calculateTotals(records);

    expect(totals.entradas).toBe(5000);
    expect(totals.saidas).toBe(1900);
    expect(totals.investimentos).toBe(800);
    expect(totals.saldo).toBe(3100);
  });

  it('deve calcular saldo da carteira e total investido ate a data limite', () => {
    expect(service.calculateWalletBalanceUntil(records, '2026-05-06')).toBe(3100);
    expect(service.calculateInvestedUntil(records, '2026-05-06')).toBe(0);
    expect(service.calculateInvestedUntil(records, '2026-05-07')).toBe(800);
  });

  it('deve filtrar registros por mês, categoria e tipo', () => {
    const filters: RecordFilters = {
      month: '2026-05',
      category: 'Moradia',
      type: 'saida',
    };

    const filteredRecords = service.filterRecords(records, filters);

    expect(filteredRecords).toHaveLength(1);
    expect(filteredRecords[0].description).toBe('Aluguel');
  });

  it('deve devolver registros filtrados em data crescente', () => {
    const filters: RecordFilters = {
      month: 'todos',
      category: 'todas',
      type: 'todos',
    };

    const filteredRecords = service.filterRecords(records, filters);

    expect(filteredRecords.map((record) => record.date)).toEqual([
      '2026-04-10',
      '2026-05-05',
      '2026-05-06',
      '2026-05-07',
    ]);
  });

  it('deve calcular projeção de meta com limite e status', () => {
    const profile: ProfileConfig = {
      id: 'conservador',
      label: 'Conservador',
      percentage: 50,
      description: 'Permite gastar até 50% das entradas do mês.',
    };

    const projection = service.calculateProjection(records, profile);

    expect(projection.limit).toBe(2500);
    expect(projection.spent).toBe(1900);
    expect(projection.spentPercentageOfIncome).toBe(38);
    expect(projection.usagePercent).toBe(76);
    expect(projection.status).toBe('positiva');
    expect(projection.dailyMargin).toBeGreaterThanOrEqual(0);
  });

  it('deve ignorar aplicacao de investimento no uso da meta', () => {
    const profile: ProfileConfig = {
      id: 'conservador',
      label: 'Conservador',
      percentage: 50,
      description: 'Permite gastar até 50% das entradas do mês.',
    };

    const projection = service.calculateProjection(
      [
        {
          id: 'entrada-meta',
          description: 'Receita',
          type: 'entrada',
          category: 'Salário',
          date: '2026-05-01',
          value: 1000,
        },
        {
          id: 'saida-investimento-meta',
          description: 'Saída Investimento',
          type: 'saida',
          category: 'Aplicação Investimento',
          date: '2026-05-02',
          value: 900,
        },
        {
          id: 'saida-meta',
          description: 'Mercado',
          type: 'saida',
          category: 'Alimentação',
          date: '2026-05-03',
          value: 200,
        },
      ],
      profile,
    );

    expect(projection.limit).toBe(500);
    expect(projection.spent).toBe(200);
    expect(projection.spentPercentageOfIncome).toBe(20);
    expect(projection.usagePercent).toBe(40);
    expect(projection.status).toBe('positiva');
  });

  it('deve atualizar a descricao do perfil junto com o percentual da meta', () => {
    service.updateProfile('conservador', 65);

    const profile = service.profilesSnapshot.find(
      (profileConfig) => profileConfig.id === 'conservador',
    );

    expect(profile?.percentage).toBe(65);
    expect(profile?.description).toBe('Permite gastar até 65% das entradas do mês.');
    expect(localStorage.getItem('controle-financeiro-angular.profiles.v1')).toContain(
      'Permite gastar até 65% das entradas do mês.',
    );
  });

  it('deve indicar despesas balanceadas quando nenhuma categoria passa de 50% das receitas', () => {
    const balance = service.calculateExpenseBalance(records);

    expect(balance.status).toBe('positiva');
    expect(balance.message).toContain('bem balanceada');
    expect(balance.largestExpense?.description).toBe('Aluguel');
    expect(balance.largestExpense?.percentageOfIncome).toBe(30);
    expect(balance.limitValue).toBe(2500);
    expect(balance.thresholdPercentage).toBe(50);
  });

  it('deve ignorar aplicacao de investimento no balanceamento de despesas', () => {
    const balance = service.calculateExpenseBalance([
      {
        id: 'entrada-balanceamento',
        description: 'Receita',
        type: 'entrada',
        category: 'Salário',
        date: '2026-05-01',
        value: 1000,
      },
      {
        id: 'saida-investimento-balanceamento',
        description: 'Saída Investimento',
        type: 'saida',
        category: 'Aplicação Investimento',
        date: '2026-05-02',
        value: 900,
      },
      {
        id: 'saida-balanceamento',
        description: 'Aluguel',
        type: 'saida',
        category: 'Moradia',
        date: '2026-05-03',
        value: 300,
      },
    ]);

    expect(balance.status).toBe('positiva');
    expect(balance.largestExpense?.description).toBe('Aluguel');
    expect(balance.largestExpense?.percentageOfIncome).toBe(30);
    expect(balance.limitValue).toBe(500);
  });

  it('deve indicar despesa desbalanceada quando uma categoria passa de 50% das receitas', () => {
    const balance = service.calculateExpenseBalance([
      ...records,
      {
        id: 'saida-3',
        description: 'Condominio',
        type: 'saida',
        category: 'Moradia',
        date: '2026-05-08',
        value: 1200,
      },
    ]);

    expect(balance.status).toBe('negativa');
    expect(balance.category).toBe('Moradia');
    expect(balance.categoryExpenseValue).toBe(2700);
    expect(balance.percentageOfIncome).toBe(54);
    expect(balance.limitValue).toBe(2500);
    expect(balance.message).toContain('desbalanceadas');
  });

  it('deve usar percentual configurado para avaliar despesa desbalanceada', () => {
    service.updateExpenseBalanceThreshold(60);

    const balance = service.calculateExpenseBalance([
      ...records,
      {
        id: 'saida-3',
        description: 'Condominio',
        type: 'saida',
        category: 'Moradia',
        date: '2026-05-08',
        value: 1200,
      },
    ]);

    expect(service.expenseBalanceThresholdPercentage).toBe(60);
    expect(balance.status).toBe('positiva');
    expect(localStorage.getItem('controle-financeiro-angular.settings.v1')).toContain('60');
  });

  it('deve limitar percentual configurado entre 30% e 100% e voltar para 50% na demo', () => {
    service.updateExpenseBalanceThreshold(20);
    expect(service.expenseBalanceThresholdPercentage).toBe(30);

    service.updateExpenseBalanceThreshold(120);
    expect(service.expenseBalanceThresholdPercentage).toBe(100);

    service.resetDemoData();
    expect(service.expenseBalanceThresholdPercentage).toBe(50);
  });

  it('deve adicionar registro com ID gerado e persistir no localStorage', () => {
    const record: NewFinancialRecord = {
      description: 'Conta de luz',
      type: 'saida',
      category: 'Moradia',
      date: '2026-05-08',
      value: 230,
    };

    service.addRecord(record);
    const [createdRecord] = service.recordsSnapshot;

    expect(createdRecord.description).toBe('Conta de luz');
    expect(createdRecord.id).toBeTruthy();
    expect(localStorage.getItem('controle-financeiro-angular.records.v2')).toContain(
      'Conta de luz',
    );
  });

  it('deve registrar investimento e saida automatica da carteira', () => {
    const initialCount = service.recordsSnapshot.length;

    service.registerInvestment({
      description: 'Aporte corretora',
      type: 'investimento',
      category: 'CDB',
      date: '2026-05-20',
      value: 1200,
    });

    expect(service.recordsSnapshot).toHaveLength(initialCount + 2);
    expect(
      service.recordsSnapshot.some(
        (record) =>
          record.description === 'Aporte corretora' &&
          record.type === 'investimento' &&
          record.category === 'CDB',
      ),
    ).toBe(true);
    expect(
      service.recordsSnapshot.some(
        (record) =>
          record.description === 'Saída Investimento' &&
          record.type === 'saida' &&
          record.category === 'Aplicação Investimento' &&
          record.date === '2026-05-20' &&
          record.value === 1200,
      ),
    ).toBe(true);
  });

  it('deve registrar entrada automatica ao resgatar investimento', () => {
    service.registerInvestment({
      description: 'Aporte resgatavel',
      type: 'investimento',
      category: 'Fundos',
      date: '2026-05-18',
      value: 900,
    });

    const investment = service.recordsSnapshot.find(
      (record) => record.description === 'Aporte resgatavel',
    );

    expect(investment).toBeTruthy();
    expect(service.redeemInvestment(investment?.id ?? '', '2026-05-24')).toBe(true);
    expect(service.recordsSnapshot.some((record) => record.id === investment?.id)).toBe(false);
    expect(
      service.recordsSnapshot.some(
        (record) =>
          record.description === 'Entrada Investimento' &&
          record.type === 'entrada' &&
          record.category === 'Resgate investimento' &&
          record.date === '2026-05-24' &&
          record.value === 900,
      ),
    ).toBe(true);
  });

  it('deve remover registro persistido', () => {
    service.addRecord({
      description: 'Despesa teste',
      type: 'saida',
      category: 'Outros',
      date: '2026-05-08',
      value: 99,
    });

    const createdRecordId = service.recordsSnapshot[0].id;
    service.deleteRecord(createdRecordId);

    expect(service.recordsSnapshot.some((record) => record.id === createdRecordId)).toBe(false);
  });

  it('deve identificar data futura para validar receitas e despesas', () => {
    expect(service.isFutureDate('2999-01-01')).toBe(true);
    expect(service.isFutureDate('2020-01-01')).toBe(false);
  });
});
