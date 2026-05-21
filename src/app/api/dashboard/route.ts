import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [vendas, despesas, insumos, faturamentos] = await Promise.all([
    prisma.venda.findMany({
      include: {
        itens: {
          include: {
            produto: {
              include: { insumos: { include: { insumo: true } } },
            },
            insumo: true,
          },
        },
      },
    }),
    prisma.despesa.findMany({ where: { ativo: true } }),
    prisma.insumo.findMany({ where: { ativo: true } }),
    prisma.faturamentoMensal.findMany({
      orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
    }),
  ]);

  // Totais gerais
  const faturamentoTotal = vendas.reduce(
    (acc: number, v: any) => acc + Number(v.total),
    0,
  );

  // Custo operacional (soma custo insumos de cada venda)
  let custoTotal = 0;
  const vendasPorDia: Record<string, { receita: number; custo: number }> = {};
  const porProduto: Record<
    string,
    { nome: string; qty: number; receita: number }
  > = {};

  for (const venda of vendas) {
    const dia = venda.criadaEm.toISOString().slice(0, 10);
    if (!vendasPorDia[dia]) vendasPorDia[dia] = { receita: 0, custo: 0 };

    let vendaCustoTotal = 0;
    for (const item of venda.itens) {
      const receita = Number(item.precoUnitario) * item.quantidade;

      // Custo dos insumos
      let custoUnit = 0;
      if (item.custoUnitarioInsumos !== null && item.custoUnitarioInsumos !== undefined) {
        custoUnit = Number(item.custoUnitarioInsumos);
      } else if (item.produtoId && item.produto) {
        // Fallback para receitas antigas
        for (const pi of item.produto.insumos) {
          const cuUnitInsumo =
            Number(pi.insumo.rsPago) / Number(pi.insumo.volumeEmbalagem);
          custoUnit += cuUnitInsumo * Number(pi.qtdBruta);
        }
      } else if (item.insumoId && item.insumo) {
        // Fallback para insumos antigos
        const vol = Number(item.insumo.volumeEmbalagem);
        custoUnit = vol > 0 ? Number(item.insumo.rsPago) / vol : 0;
      }

      const custoVenda = custoUnit * item.quantidade;
      vendaCustoTotal += custoVenda;

      // Acumula por produto
      const itemId = item.produtoId 
        ? String(item.produtoId) 
        : (item.insumoId ? `insumo-${item.insumoId}` : `custom-${item.nomeCustom}`);
      const itemName = item.produtoId && item.produto
        ? item.produto.nome
        : (item.nomeCustom ?? 'Item Avulso');

      if (!porProduto[itemId]) {
        porProduto[itemId] = {
          nome: itemName,
          qty: 0,
          receita: 0,
        };
      }
      porProduto[itemId].qty += item.quantidade;
      porProduto[itemId].receita += receita;
    }

    custoTotal += vendaCustoTotal;
    // Usar venda.total para a receita daquele dia para considerar descontos e taxas adicionais
    vendasPorDia[dia].receita += Number(venda.total);
    vendasPorDia[dia].custo += vendaCustoTotal;
  }

  // Despesas fixas e variáveis totais
  const totalFixas = despesas
    .filter((d: any) => d.tipo === 'fixa')
    .reduce((acc: number, d: any) => acc + Number(d.valor), 0);

  const totalVariaveis = despesas
    .filter((d: any) => d.tipo === 'variavel')
    .reduce((acc: number, d: any) => acc + Number(d.valor), 0); // em %

  // Estoque crítico (zero ou negativo)
  const estoqueCritico = insumos.filter(
    (i: any) => Number(i.estoqueAtual) <= 0,
  );

  // Top 5 produtos
  const top5 = Object.values(porProduto)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Evolução diária (últimos 30 dias)
  const evolucao = Object.entries(vendasPorDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([dia, v]) => ({ dia, ...v, lucro: v.receita - v.custo }));

  return NextResponse.json({
    faturamentoTotal,
    custoTotal,
    lucroLiquido: faturamentoTotal - custoTotal,
    totalVendas: vendas.length,
    totalFixas,
    totalVariaveis,
    estoqueCritico,
    top5,
    evolucao,
    faturamentos,
  });
}
