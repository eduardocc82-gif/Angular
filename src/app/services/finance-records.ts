import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { FinancialRecord, NewFinancialRecord, TransactionType } from '../models/finance.models';



type MockRecordRow = readonly [
  id: string,
  description: string,
  type: TransactionType,
  category: string,
  date: string,
  value: number,
];

@Injectable({
  providedIn: 'root',
})
export class FinanceRecords {
  // Chave versionada evita conflito com outros projetos no localStorage.
  private readonly recordsKey = 'controle-financeiro-angular.records.v2';

  // Mock inicial usado quando o localStorage ainda esta vazio.
  private readonly mockRecords: FinancialRecord[] = this.createMockRecords([
    ['maio-01-entrada', 'Projeto urgente landing page', 'entrada', 'Freelance', '2026-05-01', 2860.45],
    ['maio-02-saida', 'Mercado atacado variado', 'saida', 'Alimentação', '2026-05-02', 917.38],
    ['maio-03-entrada', 'Comissao venda antiga', 'entrada', 'Outros', '2026-05-03', 1326.77],
    ['maio-04-saida', 'Parcela aluguel comercial', 'saida', 'Moradia', '2026-05-04', 2719.6],
    ['maio-05-saida', 'Manutencao ar-condicionado', 'saida', 'Moradia', '2026-05-05', 1488.93],
    ['maio-06-entrada', 'Reembolso viagem cliente', 'entrada', 'Reembolso', '2026-05-06', 642.19],
    ['maio-07-saida', 'Uber, metro e estacionamento', 'saida', 'Transporte', '2026-05-07', 426.54],
    ['maio-08-saida', 'Consulta e exames rapidos', 'saida', 'Saúde', '2026-05-08', 783.21],
    ['maio-09-entrada', 'Ajustes sistema parceiro', 'entrada', 'Freelance', '2026-05-09', 3914.08],
    ['maio-10-investimento', 'Compra fracionada fundos', 'investimento', 'Fundos', '2026-05-10', 1250.4],
    ['maio-11-saida', 'Restaurante familia', 'saida', 'Lazer', '2026-05-11', 589.17],
    ['maio-12-saida', 'Curso intensivo online', 'saida', 'Educação', '2026-05-12', 1287.75],
    ['maio-13-entrada', 'Rendimento conta remunerada', 'entrada', 'Rendimentos', '2026-05-13', 97.62],
    ['maio-14-saida', 'Notebook para trabalho', 'saida', 'Outros', '2026-05-14', 698.32],
    ['maio-15-saida', 'Compras pequenas farmacia', 'saida', 'Saúde', '2026-05-15', 214.49],
    ['maio-16-entrada', 'Repasse variavel contrato', 'entrada', 'Salário', '2026-05-16', 14186.35],
    ['maio-17-saida', 'Supermercado reposicao', 'saida', 'Alimentação', '2026-05-17', 652.88],
    ['maio-18-investimento', 'Aporte cripto pequeno', 'investimento', 'Criptomoedas', '2026-05-18', 378.91],
    ['maio-19-saida', 'Seguro e taxas do carro', 'saida', 'Transporte', '2026-05-19', 26.73],
    ['maio-20-saida', 'Presentes e lazer final de semana', 'saida', 'Lazer', '2026-05-20', 874.56],

    ['abril-01-entrada', 'Repasse variavel contrato', 'entrada', 'Salário', '2026-04-01', 9732.84],
    ['abril-02-saida', 'Condominio com taxa extra', 'saida', 'Moradia', '2026-04-02', 188.71],
    ['abril-03-saida', 'Feira grande e carnes', 'saida', 'Alimentação', '2026-04-03', 247.66],
    ['abril-04-entrada', 'Consultoria automacao', 'entrada', 'Freelance', '2026-04-04', 2467.09],
    ['abril-05-saida', 'Revisao completa do carro', 'saida', 'Transporte', '2026-04-05', 846.2],
    ['abril-06-saida', 'Assinaturas anuais', 'saida', 'Outros', '2026-04-06', 738.44],
    ['abril-07-entrada', 'Reembolso material comprado', 'entrada', 'Reembolso', '2026-04-07', 1194.58],
    ['abril-08-saida', 'Dentista procedimento', 'saida', 'Saúde', '2026-04-08', 2296.35],
    ['abril-09-investimento', 'Tesouro Selic abril', 'investimento', 'Tesouro Direto', '2026-04-09', 2060.8],
    ['abril-10-saida', 'Mercado bairro emergencial', 'saida', 'Alimentação', '2026-04-10', 389.91],
    ['abril-11-entrada', 'Venda equipamento usado', 'entrada', 'Outros', '2026-04-11', 1835.72],
    ['abril-12-saida', 'Viagem curta hospedagem', 'saida', 'Lazer', '2026-04-12', 2157.49],
    ['abril-13-saida', 'Mentoria e livros', 'saida', 'Educação', '2026-04-13', 946.18],
    ['abril-14-entrada', 'Rendimento CDI', 'entrada', 'Rendimentos', '2026-04-14', 121.34],
    ['abril-15-saida', 'Reforma cozinha parcela', 'saida', 'Moradia', '2026-04-15', 11890.7],
    ['abril-16-saida', 'Combustivel estrada', 'saida', 'Transporte', '2026-04-16', 673.25],
    ['abril-17-entrada', 'Layout aplicativo mobile', 'entrada', 'Freelance', '2026-04-17', 3178.66],
    ['abril-18-saida', 'Plano saude coparticipacao', 'saida', 'Saúde', '2026-04-18', 1175.8],
    ['abril-19-investimento', 'Acoes carteira abril', 'investimento', 'Ações', '2026-04-19', 894.27],
    ['abril-21-saida', 'Restaurantes feriado', 'saida', 'Lazer', '2026-04-21', 738.92],
    ['abril-24-entrada', 'Suporte tecnico remoto', 'entrada', 'Freelance', '2026-04-24', 689.47],
    ['abril-28-saida', 'Material certificacao', 'saida', 'Educação', '2026-04-28', 512.69],

    ['marco-01-saida', 'Aluguel e taxas prediais', 'saida', 'Moradia', '2026-03-01', 2798.33],
    ['marco-02-entrada', 'Repasse variavel contrato', 'entrada', 'Salário', '2026-03-02', 6811.52],
    ['marco-03-saida', 'Supermercado inicio mes', 'saida', 'Alimentação', '2026-03-03', 63.57],
    ['marco-04-entrada', 'Landing page campanha', 'entrada', 'Freelance', '2026-03-04', 1544.23],
    ['marco-05-saida', 'IPVA e licenciamento', 'saida', 'Transporte', '2026-03-05', 262.15],
    ['marco-06-saida', 'Hospital particular', 'saida', 'Saúde', '2026-03-06', 5940.8],
    ['marco-07-entrada', 'Reembolso parcial hospital', 'entrada', 'Reembolso', '2026-03-07', 2218.42],
    ['marco-08-saida', 'Livros e apostilas', 'saida', 'Educação', '2026-03-08', 474.3],
    ['marco-09-investimento', 'CDB liquidez diaria', 'investimento', 'CDB', '2026-03-09', 1690.55],
    ['marco-10-saida', 'Cinema e jantar', 'saida', 'Lazer', '2026-03-10', 396.84],
    ['marco-11-entrada', 'Venda monitor e cadeira', 'entrada', 'Outros', '2026-03-11', 11289.99],
    ['marco-12-saida', 'Compras pet e utilidades', 'saida', 'Outros', '2026-03-12', 816.27],
    ['marco-13-saida', 'Mercado organicos', 'saida', 'Alimentação', '2026-03-13', 532.75],
    ['marco-14-entrada', 'Rendimento aplicacoes', 'entrada', 'Rendimentos', '2026-03-14', 88.73],
    ['marco-15-saida', 'Troca pneus carro', 'saida', 'Transporte', '2026-03-15', 2468.9],
    ['marco-16-entrada', 'Dashboard Power BI', 'entrada', 'Freelance', '2026-03-16', 4362.16],
    ['marco-17-saida', 'Conserto encanamento', 'saida', 'Moradia', '2026-03-17', 1425.64],
    ['marco-20-investimento', 'Fundos multimercado', 'investimento', 'Fundos', '2026-03-20', 735.39],
    ['marco-22-saida', 'Viagem bate-volta', 'saida', 'Lazer', '2026-03-22', 1284.61],
    ['marco-24-saida', 'Curso presencial rapido', 'saida', 'Educação', '2026-03-24', 1498.2],
    ['marco-27-entrada', 'Plantao fim de semana', 'entrada', 'Freelance', '2026-03-27', 742.68],
    ['marco-30-saida', 'Despesa cartorio', 'saida', 'Outros', '2026-03-30', 29.45],

    ['fevereiro-01-entrada', 'Repasse variavel contrato', 'entrada', 'Salário', '2026-02-01', 5244.18],
    ['fevereiro-02-saida', 'Aluguel fevereiro', 'saida', 'Moradia', '2026-02-02', 516.47],
    ['fevereiro-03-saida', 'Atacado alimentos', 'saida', 'Alimentação', '2026-02-03', 388.62],
    ['fevereiro-04-entrada', 'Suporte sistema legado', 'entrada', 'Freelance', '2026-02-04', 987.35],
    ['fevereiro-05-saida', 'Bilhetes e combustivel', 'saida', 'Transporte', '2026-02-05', 547.96],
    ['fevereiro-06-saida', 'Exames laboratoriais', 'saida', 'Saúde', '2026-02-06', 642.5],
    ['fevereiro-07-entrada', 'Reembolso compra cliente', 'entrada', 'Reembolso', '2026-02-07', 1688.24],
    ['fevereiro-08-saida', 'Curso ingles intensivo', 'saida', 'Educação', '2026-02-08', 32.14],
    ['fevereiro-09-investimento', 'Cripto compra pontual', 'investimento', 'Criptomoedas', '2026-02-09', 475.86],
    ['fevereiro-10-saida', 'Troca hidraulica emergencial', 'saida', 'Moradia', '2026-02-10', 15000],
    ['fevereiro-11-saida', 'Restaurante aniversario', 'saida', 'Lazer', '2026-02-11', 867.43],
    ['fevereiro-12-entrada', 'Rendimento reserva', 'entrada', 'Rendimentos', '2026-02-12', 62.11],
    ['fevereiro-13-saida', 'Farmacia e vitaminas', 'saida', 'Saúde', '2026-02-13', 318.72],
    ['fevereiro-14-entrada', 'Projeto e-commerce', 'entrada', 'Freelance', '2026-02-14', 3710.58],
    ['fevereiro-15-saida', 'Mercado reposicao', 'saida', 'Alimentação', '2026-02-15', 489.77],
    ['fevereiro-16-saida', 'Multa e documentacao', 'saida', 'Transporte', '2026-02-16', 196.4],
    ['fevereiro-18-investimento', 'Tesouro prefixado', 'investimento', 'Tesouro Direto', '2026-02-18', 1325.72],
    ['fevereiro-20-saida', 'Notebook assistencia tecnica', 'saida', 'Outros', '2026-02-20', 2197.33],
    ['fevereiro-22-entrada', 'Venda celular usado', 'entrada', 'Outros', '2026-02-22', 1435.5],
    ['fevereiro-24-saida', 'Viagem praia carnaval', 'saida', 'Lazer', '2026-02-24', 384.65],
    ['fevereiro-26-saida', 'Aula particular pacote', 'saida', 'Educação', '2026-02-26', 604.28],
    ['fevereiro-28-entrada', 'Manutencao site cliente', 'entrada', 'Freelance', '2026-02-28', 858.9],

    ['janeiro-01-entrada', 'Repasse variavel contrato', 'entrada', 'Salário', '2026-01-02', 7436.29],
    ['janeiro-02-saida', 'Aluguel janeiro', 'saida', 'Moradia', '2026-01-03', 2368.52],
    ['janeiro-03-saida', 'Compras ceasa e mercado', 'saida', 'Alimentação', '2026-01-04', 946.41],
    ['janeiro-04-entrada', 'Ajustes loja virtual', 'entrada', 'Freelance', '2026-01-05', 1728.64],
    ['janeiro-05-saida', 'Combustivel viagem', 'saida', 'Transporte', '2026-01-06', 781.93],
    ['janeiro-06-saida', 'Consulta dermatologista', 'saida', 'Saúde', '2026-01-07', 415.25],
    ['janeiro-07-investimento', 'CDB pos-fixado', 'investimento', 'CDB', '2026-01-08', 1128.7],
    ['janeiro-08-entrada', 'Reembolso hospedagem', 'entrada', 'Reembolso', '2026-01-09', 914.33],
    ['janeiro-09-saida', 'Material escolar completo', 'saida', 'Educação', '2026-01-10', 1364.88],
    ['janeiro-10-saida', 'Restaurante praia', 'saida', 'Lazer', '2026-01-11', 692.15],
    ['janeiro-11-entrada', 'Rendimento conta janeiro', 'entrada', 'Rendimentos', '2026-01-12', 51.96],
    ['janeiro-12-saida', 'Compra eletrodomestico', 'saida', 'Outros', '2026-01-13', 899.9],
    ['janeiro-13-saida', 'Supermercado reposicao', 'saida', 'Alimentação', '2026-01-15', 534.27],
    ['janeiro-14-entrada', 'Projeto relatorio gerencial', 'entrada', 'Freelance', '2026-01-17', 2986.41],
    ['janeiro-15-saida', 'Pintura quarto', 'saida', 'Moradia', '2026-01-18', 1847.62],
    ['janeiro-16-saida', 'Seguro veiculo parcela', 'saida', 'Transporte', '2026-01-19', 267.34],
    ['janeiro-17-investimento', 'Fundo renda fixa', 'investimento', 'Fundos', '2026-01-21', 676.22],
    ['janeiro-18-saida', 'Medicamentos diversos', 'saida', 'Saúde', '2026-01-23', 283.46],
    ['janeiro-19-entrada', 'Venda mesa escritorio', 'entrada', 'Outros', '2026-01-24', 489.8],
    ['janeiro-20-saida', 'Passagem evento', 'saida', 'Educação', '2026-01-26', 812.57],
    ['janeiro-21-saida', 'Show e deslocamento', 'saida', 'Lazer', '2026-01-28', 48.36],
    ['janeiro-22-saida', 'Taxas e cartorio', 'saida', 'Outros', '2026-01-30', 296.74],
  ]);

  // Stream de lancamentos sincronizado apos salvar, excluir ou restaurar dados.
  private readonly recordsSubject = new BehaviorSubject<FinancialRecord[]>(this.loadRecords());

  // Observable publico consumido pelas paginas.
  readonly records$ = this.recordsSubject.asObservable();

  /** Exposicao sincrona dos lancamentos atuais para getters de componentes. */
  get recordsSnapshot(): FinancialRecord[] {
    return this.recordsSubject.value;
  }

  /** Adiciona um lancamento com ID gerado e valor numerico normalizado. */
  addRecord(record: NewFinancialRecord): void {
    const newRecord: FinancialRecord = {
      ...record,
      id: crypto.randomUUID(),
      value: Number(record.value),
    };

    const updatedRecords = [newRecord, ...this.recordsSubject.value];
    this.persistRecords(updatedRecords);
  }

  /** Remove um lancamento pelo ID e propaga a nova lista para os assinantes. */
  deleteRecord(recordId: string): void {
    const updatedRecords = this.recordsSubject.value.filter((record) => record.id !== recordId);
    this.persistRecords(updatedRecords);
  }

  /** Restaura a base de exemplo usada em apresentacoes e testes manuais. */
  resetDemoData(): void {
    this.persistRecords([...this.mockRecords]);
  }

  /** Carrega lancamentos do localStorage ou inicializa com o mock padrao. */
  private loadRecords(): FinancialRecord[] {
    try {
      const storedRecords = localStorage.getItem(this.recordsKey);
      if (!storedRecords) {
        return [...this.mockRecords];
      }

      return JSON.parse(storedRecords) as FinancialRecord[];
    } catch {
      return [...this.mockRecords];
    }
  }

  private createMockRecords(rows: readonly MockRecordRow[]): FinancialRecord[] {
    return rows.map(([id, description, type, category, date, value]) => ({
      id: `mock-${id}`,
      description,
      type,
      category,
      date,
      value,
    }));
  }

  /** Persiste lancamentos e atualiza o BehaviorSubject em um unico ponto. */
  private persistRecords(records: FinancialRecord[]): void {
    localStorage.setItem(this.recordsKey, JSON.stringify(records));
    this.recordsSubject.next(records);
  }
}
