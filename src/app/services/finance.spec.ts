import { TestBed } from '@angular/core/testing';

import { FinancialRecord, NewFinancialRecord, ProfileConfig, RecordFilters } from '../models/finance.models';
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
    expect(projection.status).toBe('positiva');
    expect(projection.dailyMargin).toBeGreaterThanOrEqual(0);
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
    expect(localStorage.getItem('controle-financeiro-angular.records.v1')).toContain('Conta de luz');
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
