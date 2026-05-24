import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { FinancialRecord, NewFinancialRecord, RecordFilters } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-investimentos',
  standalone: false,
  templateUrl: './investimentos.html',
  styleUrl: './investimentos.scss',
})
export class Investimentos implements OnInit, OnDestroy {
  // Rota dedicada a aportes, resgates e visao acumulada da carteira.
  records: FinancialRecord[] = [];
  filters: RecordFilters = { month: 'todos', category: 'todas', type: 'investimento' };
  message = '';

  private subscription = new Subscription();

  constructor(private readonly finance: Finance) {}

  // Carrega registros persistidos.
  ngOnInit(): void {
    this.subscription = this.finance.records$.subscribe((records) => {
      this.records = records;
    });
  }

  // Libera subscription quando sai da rota.
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Lista apenas investimentos cadastrados.
  get investmentRecords(): FinancialRecord[] {
    return this.records.filter((record) => record.type === 'investimento');
  }

  // Investimentos filtrados por mês e categoria.
  get filteredRecords(): FinancialRecord[] {
    return this.finance.filterRecords(this.records, this.filters);
  }

  // Soma total de aportes filtrados.
  get totalInvested(): number {
    return this.filteredRecords.reduce((total, record) => total + record.value, 0);
  }

  // Saldo consolidado de entradas menos despesas registradas ate hoje.
  get walletBalanceToday(): number {
    return this.finance.calculateWalletBalanceUntil(this.records);
  }

  // Ajusta a cor do card conforme saldo positivo ou negativo.
  get walletBalanceTone(): 'green' | 'red' | 'blue' | 'yellow' {
    return this.walletBalanceToday >= 0 ? 'green' : 'red';
  }

  // Meses disponíveis para filtro.
  get months(): string[] {
    return this.finance.listAvailableMonths(this.investmentRecords);
  }

  // Categorias específicas do módulo de investimentos.
  get categories(): string[] {
    return this.finance.getCategoriesForType('investimento');
  }

  // Salva aporte emitido pelo formulário filho.
  saveInvestment(record: NewFinancialRecord): void {
    this.finance.registerInvestment(record);
    this.message = 'Investimento registrado e saída da carteira lançada.';
  }

  // Atualiza filtros mantendo o tipo fixo como investimento.
  updateFilters(filters: RecordFilters): void {
    this.filters = { ...filters, type: 'investimento' };
  }

  // Registra entrada de resgate e remove o aporte da lista de investimentos.
  redeemInvestment(recordId: string): void {
    const redeemed = this.finance.redeemInvestment(recordId);
    this.message = redeemed
      ? 'Resgate lançado como entrada e investimento removido.'
      : 'Investimento não encontrado para resgate.';
  }
}
