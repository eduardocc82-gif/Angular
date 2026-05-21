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

  it('deve indicar despesas balanceadas quando nenhuma categoria passa de 50% das receitas', () => {
    const balance = service.calculateExpenseBalance(records);

    expect(balance.status).toBe('positiva');
    expect(balance.message).toContain('bem balanceada');
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
    expect(balance.percentageOfIncome).toBe(54);
    expect(balance.message).toContain('Verifique o item Moradia');
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
