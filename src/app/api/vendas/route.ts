import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limite = searchParams.get('limite') ? +searchParams.get('limite')! : 50

  const vendas = await prisma.venda.findMany({
    take: limite,
    orderBy: { criadaEm: 'desc' },
    include: {
      itens: {
        include: { produto: { select: { nome: true, categoria: true } } },
      },
    },
  })
  return NextResponse.json(vendas)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { itens, canal } = body

  // Para iFood, busca precoIfood do produto se não vier explícito
  const itensComPreco = await Promise.all(
    itens.map(async (item: { produtoId: number; quantidade: number; precoUnitario?: number }) => {
      if (item.precoUnitario !== undefined) return item
      const produto = await prisma.produto.findUnique({ where: { id: item.produtoId } })
      const preco = canal === 'ifood'
        ? Number(produto?.precoIfood ?? produto?.precoVenda ?? 0)
        : Number(produto?.precoVenda ?? 0)
      return { ...item, precoUnitario: preco }
    })
  )

  const total = itensComPreco.reduce(
    (acc: number, item: { quantidade: number; precoUnitario: number }) =>
      acc + item.quantidade * item.precoUnitario,
    0
  )

  const venda = await prisma.$transaction(async (tx: TxClient) => {
    const v = await tx.venda.create({
      data: {
        canal: canal ?? 'salao',
        total,
        itens: {
          create: itensComPreco.map((i: { produtoId: number; quantidade: number; precoUnitario: number }) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
          })),
        },
      },
      include: { itens: true },
    })

    for (const item of itensComPreco) {
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
    }

    return v
  })

  return NextResponse.json(venda, { status: 201 })
}
