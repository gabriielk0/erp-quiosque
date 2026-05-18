import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const insumos = await prisma.insumo.findMany({
    where: { ativo: true },
    orderBy: { codigo: 'asc' },
  })
  return NextResponse.json(insumos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const insumo = await prisma.insumo.create({ data: body })
  return NextResponse.json(insumo, { status: 201 })
}
