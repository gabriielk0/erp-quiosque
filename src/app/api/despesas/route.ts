import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const despesas = await prisma.despesa.findMany({
    where: { ativo: true },
    orderBy: [{ tipo: 'asc' }, { descricao: 'asc' }],
  })
  return NextResponse.json(despesas)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const despesa = await prisma.despesa.create({ data: body })
  return NextResponse.json(despesa, { status: 201 })
}
