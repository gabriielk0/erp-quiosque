export type CategoryType = 'FIXED' | 'VARIABLE';

export interface ExpenseCategory {
  id: number;
  nome: string;
  tipo: CategoryType;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface FinancialRecord {
  id: number;
  descricao: string;
  valor: number; // R$ se FIXED, % se VARIABLE
  ano: number;
  mes: number; // 1-12
  categoriaId: number;
  categoria?: ExpenseCategory;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface MonthlyRevenue {
  id: number;
  ano: number;
  mes: number; // 1-12
  faturamento: number;
  cmvMeta?: number;
  lucroMeta?: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

/**
 * Parâmetros de entrada para as fórmulas financeiras (em tempo real)
 */
export interface FinancialMetricsInput {
  faturamentoMensal: number;   // Faturamento real ou estimado do mês (R$)
  custosFixosTotal: number;    // Soma das despesas fixas (R$)
  custosVariaveisTaxa: number; // Soma de todas as alíquotas de despesas variáveis (%)
  cmvMetaTaxa: number;         // Percentual do CMV Meta desejado (%)
  lucroMetaTaxa: number;        // Percentual de Margem de Lucro Desejada (%)
}

/**
 * Resultados matemáticos gerados em tempo real pelo motor de cálculo
 */
export interface FinancialMetricsResult {
  percentualDespesasFixas: number;    // %DF
  percentualDespesasVariaveis: number; // %DV
  divisorMarkup: number;
  multiplicadorMarkup: number;
  pontoEquilibrio: number;             // Ponto de Equilíbrio (R$)
  custosTotaisCalculados: number;      // Soma dos percentuais (%DF + %DV + %CMV + %Lucro)
  insolvente: boolean;                 // Flag de trava para evitar divisão por zero/negativo
}
