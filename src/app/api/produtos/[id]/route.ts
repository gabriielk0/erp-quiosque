import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { insumos, ...produtoData } = body

  await prisma.produtoInsumo.deleteMany({ where: { produtoId: +params.id } })

  const produto = await prisma.produto.update({
    where: { id: +params.id },
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
    include: { insumos: { include: { insumo: true } } },
  })

  return NextResponse.json(produto)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.produto.update({ where: { id: +params.id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
