import { Injectable } from '@angular/core';

import { CategoryMap, TransactionType } from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class FinanceCategories {
  // Categorias padrao por tipo; "Outros" fica no final como solicitado.
  readonly categories: CategoryMap = {
    entrada: ['Salário', 'Freelance', 'Reembolso', 'Rendimentos', 'Outros'],
    saida: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
    investimento: ['Tesouro Direto', 'CDB', 'Fundos', 'Ações', 'Criptomoedas', 'Outros'],
  };

  /** Retorna as categorias correspondentes ao tipo de transacao selecionado. */
  getCategoriesForType(type: TransactionType): string[] {
    return this.categories[type];
  }

  /** Junta todas as categorias em uma lista unica para uso nos filtros. */
  getAllCategories(): string[] {
    const uniqueCategories = new Set<string>();
    (Object.values(this.categories) as string[][]).forEach((categoryList: string[]) => {
      categoryList.forEach((category: string) => uniqueCategories.add(category));
    });

    return Array.from(uniqueCategories);
  }
}
