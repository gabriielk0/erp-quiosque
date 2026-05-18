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
    number,
    { nome: string; qty: number; receita: number }
  > = {};

  for (const venda of vendas) {
    const dia = venda.criadaEm.toISOString().slice(0, 10);
    if (!vendasPorDia[dia]) vendasPorDia[dia] = { receita: 0, custo: 0 };

    for (const item of venda.itens) {
      const receita = Number(item.precoUnitario) * item.quantidade;
      vendasPorDia[dia].receita += receita;

      // Custo dos insumos
      let custoProduto = 0;
      for (const pi of item.produto.insumos) {
        const cuUnit =
          Number(pi.insumo.rsPago) / Number(pi.insumo.volumeEmbalagem);
        custoProduto += cuUnit * Number(pi.qtdBruta);
      }
      const custoVenda = custoProduto * item.quantidade;
      custoTotal += custoVenda;
      vendasPorDia[dia].custo += custoVenda;

      // Acumula por produto
      if (!porProduto[item.produtoId]) {
        porProduto[item.produtoId] = {
          nome: item.produto.nome,
          qty: 0,
          receita: 0,
        };
      }
      porProduto[item.produtoId].qty += item.quantidade;
      porProduto[item.produtoId].receita += receita;
    }
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
