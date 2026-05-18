import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const insumo = await prisma.insumo.update({ where: { id: +params.id }, data: body })
  return NextResponse.json(insumo)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.insumo.update({ where: { id: +params.id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
