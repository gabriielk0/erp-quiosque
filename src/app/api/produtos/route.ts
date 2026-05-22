import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    include: {
      categoria: true,
      insumos: {
        include: { insumo: true },
      },
    },
    orderBy: { codigo: 'asc' },
  })
  return NextResponse.json(produtos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { insumos, ...produtoData } = body

  const produto = await prisma.produto.create({
    data: {
      ...produtoData,
      insumos: {
        create: insumos?.map((i: { insumoId: number; qtdBruta: number; qtdLiquida?: number; fatorCorrecao?: number; medidaCaseira?: string }) => ({
          insumoId: i.insumoId,
          qtdBruta: i.qtdBruta,
          qtdLiquida: i.qtdLiquida ?? null,
          fatorCorrecao: i.fatorCorrecao ?? null,
          medidaCaseira: i.medidaCaseira ?? null,
        })),
      },
    },
    include: { 
      categoria: true,
      insumos: { include: { insumo: true } } 
    },
  })

  return NextResponse.json(produto, { status: 201 })
}
