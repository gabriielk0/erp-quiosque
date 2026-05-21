import { FinancialMetricsInput, FinancialMetricsResult } from '@/types/finance';

/**
 * Calcula as métricas financeiras essenciais para o negócio em tempo real.
 * 
 * Fórmulas:
 * - %DF = (Custos Fixos / Faturamento Mensal) * 100
 * - %DV = Somatório de alíquotas variáveis
 * - Divisor de Markup = (100 - (%DF + %DV + %CMV_Meta + %Lucro_Meta)) / 100
 * - Multiplicador de Markup = 1 / Divisor de Markup
 * - Ponto de Equilíbrio = Custos Fixos / Divisor de Markup
 * 
 * Trata o caso de Ponto de Insolvência se a soma dos percentuais >= 100%.
 */
export function calcularMetricasFinanceiras(input: FinancialMetricsInput): FinancialMetricsResult {
  const {
    faturamentoMensal,
    custosFixosTotal,
    custosVariaveisTaxa,
    cmvMetaTaxa,
    lucroMetaTaxa
  } = input;

  // 1. % Despesas Fixas (%DF)
  const percentualDespesasFixas = faturamentoMensal > 0
    ? (custosFixosTotal / faturamentoMensal) * 100
    : 0;

  // 2. % Despesas Variáveis (%DV) - Já vem como taxa acumulada (%) da entrada
  const percentualDespesasVariaveis = custosVariaveisTaxa;

  // 3. Soma total dos percentuais que competem pela receita
  const custosTotaisCalculados = 
    percentualDespesasFixas + 
    percentualDespesasVariaveis + 
    cmvMetaTaxa + 
    lucroMetaTaxa;

  // 4. Trava de Ponto de Insolvência
  // Se a soma dos percentuais bater ou ultrapassar 100%, o negócio é insolvente 
  // (não sobra margem para cobrir custos e gerar o lucro desejado)
  const insolvente = custosTotaisCalculados >= 100;

  let divisorMarkup = 0;
  let multiplicadorMarkup = 0;
  let pontoEquilibrio = 0;

  if (insolvente) {
    // Evita divisão por zero ou valores negativos na UI
    divisorMarkup = 0;
    multiplicadorMarkup = 0;
    // O ponto de equilíbrio é inalcançável/infinito neste cenário comercialmente inviável
    pontoEquilibrio = 0;
  } else {
    // Divisor de Markup: (100 - soma) / 100
    divisorMarkup = (100 - custosTotaisCalculados) / 100;
    multiplicadorMarkup = divisorMarkup > 0 ? 1 / divisorMarkup : 0;
    pontoEquilibrio = divisorMarkup > 0 ? custosFixosTotal / divisorMarkup : 0;
  }

  return {
    percentualDespesasFixas: parseFloat(percentualDespesasFixas.toFixed(4)),
    percentualDespesasVariaveis: parseFloat(percentualDespesasVariaveis.toFixed(4)),
    divisorMarkup: parseFloat(divisorMarkup.toFixed(6)),
    multiplicadorMarkup: parseFloat(multiplicadorMarkup.toFixed(4)),
    pontoEquilibrio: parseFloat(pontoEquilibrio.toFixed(2)),
    custosTotaisCalculados: parseFloat(custosTotaisCalculados.toFixed(4)),
    insolvente
  };
}
