// Tipos centrais do domínio financeiro usados por componentes e serviços.
export type TransactionType = 'entrada' | 'saida' | 'investimento';

// Cada registro financeiro segue os campos obrigatórios definidos na especificação.
export interface FinancialRecord {
  id: string;
  description: string;
  type: TransactionType;
  category: string;
  date: string;
  value: number;
}

// Payload usado pelo formulário antes do Service gerar o ID com crypto.randomUUID().
export interface NewFinancialRecord {
  description: string;
  type: TransactionType;
  category: string;
  date: string;
  value: number;
}

// Filtros compartilhados entre Dashboard, tabela e páginas de listagem.
export interface RecordFilters {
  month: string;
  category: string;
  type: TransactionType | 'todos';
}

// Configuração de perfil ajustável pela tela de configurações.
export interface ProfileConfig {
  id: 'leve' | 'conservador' | 'arrojado';
  label: string;
  percentage: number;
  description: string;
}

// Soma consolidada exibida nos cards de resumo.
export interface SummaryTotals {
  entradas: number;
  saidas: number;
  investimentos: number;
  saldo: number;
}

// Resultado calculado para metas e margem diária.
export interface ProjectionResult {
  limit: number;
  spent: number;
  usagePercent: number;
  dailyMargin: number;
  status: 'positiva' | 'alerta' | 'negativa';
  message: string;
}

// Pacote de categorias padrão, sempre encerrando com "Outros".
export interface CategoryMap {
  entrada: string[];
  saida: string[];
  investimento: string[];
}
