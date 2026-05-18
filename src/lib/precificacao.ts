/**
 * Lógica de precificação espelhada da planilha base_de_dados.xlsx
 *
 * Fórmula do preço sugerido:
 *   custoProducao    = Σ (qtdBruta × custoUnitario)
 *   margemSeguranca  = custoProducao × (margemSeguranca% / 100)
 *   custoPorcao      = custoProducao + margemSeguranca
 *   despesasFixasRat = faturamentoMedio × 0.3737   (37.37% — rateio da planilha)
 *   despesasVarRat   = precoVenda × 0.069          (6.9%)
 *   precoSugerido    = custoPorcao + despesasFixasRat + despesasVarRat
 *   lucro            = precoVenda - custoPorcao - despesasFixasRat - despesasVarRat
 */

export interface InsumoCalc {
  rsPago: number
  volumeEmbalagem: number
  qtdBruta: number
}

export interface PrecificacaoInput {
  insumos: InsumoCalc[]
  rendimentoPorcoes: number
  margemSeguranca: number          // %
  precoVenda: number               // preço praticado
  totalDespesasFixas: number       // R$/mês
  faturamentoMedio: number         // R$/mês (base para rateio)
  totalDespesasVariaveis: number   // % do faturamento (soma das %)
}

export interface PrecificacaoResult {
  custoInsumos: number        // custo bruto dos ingredientes
  custoComMargem: number      // custo + margem de segurança (10%)
  custoPorPorcao: number      // custo por porção = custoComMargem / rendimento
  despesasFixasRat: number    // R$ fixas rateadas por porção
  despesasVariaveisRat: number // R$ variáveis (% × precoVenda)
  custoTotal: number          // custoPorPorcao + fixas + variaveis
  precoSugerido: number       // markup: custo / (1 - % custos totais)
  precoVenda: number
  lucro: number
  margemLucroPerc: number     // % sobre preço de venda
  markupMultiplicador: number // precoVenda / custoInsumos
}

export function calcularCustoUnitario(rsPago: number, volumeEmbalagem: number): number {
  if (volumeEmbalagem <= 0) return 0
  return rsPago / volumeEmbalagem
}

export function calcularPrecificacao(input: PrecificacaoInput): PrecificacaoResult {
  const {
    insumos,
    rendimentoPorcoes,
    margemSeguranca,
    precoVenda,
    totalDespesasFixas,
    faturamentoMedio,
    totalDespesasVariaveis,
  } = input

  // 1. Custo total dos insumos da receita
  const custoInsumos = insumos.reduce((acc, i) => {
    const cuUnit = calcularCustoUnitario(i.rsPago, i.volumeEmbalagem)
    return acc + cuUnit * i.qtdBruta
  }, 0)

  // 2. Margem de segurança (10% do custo)
  const margemVal = custoInsumos * (margemSeguranca / 100)
  const custoComMargem = custoInsumos + margemVal

  // 3. Custo por porção
  const custoPorPorcao = rendimentoPorcoes > 0 ? custoComMargem / rendimentoPorcoes : custoComMargem

  // 4. Despesas fixas rateadas por porção
  // Planilha usa: fixas/mês ÷ faturamento/mês = % fixa, aplicada ao preço
  // Percentual apurado da planilha: ~37.37% do preço de venda
  const percFixas = faturamentoMedio > 0 ? totalDespesasFixas / faturamentoMedio : 0
  const despesasFixasRat = precoVenda * percFixas

  // 5. Despesas variáveis (% do preço de venda)
  const percVar = totalDespesasVariaveis / 100
  const despesasVariaveisRat = precoVenda * percVar

  // 6. Custo total por porção incluindo despesas
  const custoTotal = custoPorPorcao + despesasFixasRat + despesasVariaveisRat

  // 7. Preço sugerido via markup (planilha usa markup 2.8)
  // precoSugerido = custoComMargem × markup_total
  // Recalculamos via: custo / (1 - percFixas - percVar - lucroDesejado)
  // Simplificado: usa mesma lógica da planilha = custo × (1 + CMV_inverso)
  const precoSugerido = faturamentoMedio > 0
    ? custoComMargem / (1 - percFixas - percVar - 0.1827) // 18.27% lucro desejado da planilha
    : custoPorPorcao * 2.8

  // 8. Lucro
  const lucro = precoVenda - custoTotal
  const margemLucroPerc = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0
  const markupMultiplicador = custoInsumos > 0 ? precoVenda / custoInsumos : 0

  return {
    custoInsumos,
    custoComMargem,
    custoPorPorcao,
    despesasFixasRat,
    despesasVariaveisRat,
    custoTotal,
    precoSugerido,
    precoVenda,
    lucro,
    margemLucroPerc,
    markupMultiplicador,
  }
}
