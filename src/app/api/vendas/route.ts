import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limite = searchParams.get('limite') ? +searchParams.get('limite')! : 50

  const vendas = await prisma.venda.findMany({
    take: limite,
    orderBy: { criadaEm: 'desc' },
    include: {
      itens: {
        include: {
          produto: { select: { nome: true, categoria: true } },
          insumo: { select: { nome: true } },
        },
      },
    },
  })
  return NextResponse.json(vendas)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itens, canal, desconto = 0, taxaAdicional = 0, observacoes = '' } = body

    const itensComPreco = await Promise.all(
      itens.map(async (item: {
        produtoId?: number | null;
        insumoId?: number | null;
        nomeCustom?: string | null;
        quantidade: number;
        precoUnitario?: number;
      }) => {
        let preco = item.precoUnitario ?? 0
        let custoUnitarioInsumos = 0
        let nomeCustom = item.nomeCustom ?? null

        if (item.produtoId) {
          const produto = await prisma.produto.findUnique({
            where: { id: item.produtoId },
            include: { insumos: { include: { insumo: true } } }
          })
          if (produto) {
            if (item.precoUnitario === undefined || item.precoUnitario === null) {
              preco = canal === 'ifood'
                ? Number(produto.precoIfood ?? produto.precoVenda ?? 0)
                : Number(produto.precoVenda ?? 0)
            }
            // Calcular snapshot do custo unitário de fabricação
            custoUnitarioInsumos = produto.insumos.reduce((acc, pi) => {
              const volume = Number(pi.insumo.volumeEmbalagem)
              const custoUnit = volume > 0 ? Number(pi.insumo.rsPago) / volume : 0
              return acc + (custoUnit * Number(pi.qtdBruta))
            }, 0)
          }
        } else if (item.insumoId) {
          const insumo = await prisma.insumo.findUnique({
            where: { id: item.insumoId }
          })
          if (insumo) {
            if (!nomeCustom) {
              nomeCustom = insumo.nome
            }
            const volume = Number(insumo.volumeEmbalagem)
            custoUnitarioInsumos = volume > 0 ? Number(insumo.rsPago) / volume : 0
          }
        }

        return {
          ...item,
          precoUnitario: preco,
          custoUnitarioInsumos,
          nomeCustom
        }
      })
    )

    const subtotal = itensComPreco.reduce(
      (acc: number, item) => acc + item.quantidade * item.precoUnitario,
      0
    )

    const total = subtotal - Number(desconto) + Number(taxaAdicional)

    const venda = await prisma.$transaction(async (tx: any) => {
      const v = await tx.venda.create({
        data: {
          canal: canal ?? 'salao',
          subtotal,
          desconto,
          taxaAdicional,
          total,
          observacoes,
          itens: {
            create: itensComPreco.map((i) => ({
              produtoId: i.produtoId || null,
              insumoId: i.insumoId || null,
              nomeCustom: i.nomeCustom || null,
              quantidade: i.quantidade,
              precoUnitario: i.precoUnitario,
              custoUnitarioInsumos: i.custoUnitarioInsumos,
            })),
          },
        },
        include: { itens: true },
      })

      // Baixa de estoque
      for (const item of itensComPreco) {
        if (item.produtoId) {
          const produtoInsumos = await tx.produtoInsumo.findMany({
            where: { produtoId: item.produtoId },
          })
          for (const pi of produtoInsumos) {
            const baixa = Number(pi.qtdBruta) * item.quantidade
            await tx.insumo.update({
              where: { id: pi.insumoId },
              data: { estoqueAtual: { decrement: baixa } },
            })
          }
        } else if (item.insumoId) {
          await tx.insumo.update({
            where: { id: item.insumoId },
            data: { estoqueAtual: { decrement: item.quantidade } }
          })
        }
      }

      return v
    })

    return NextResponse.json(venda, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
