import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categorias = await prisma.menuCategory.findMany({
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(categorias)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const categoria = await prisma.menuCategory.create({
      data: { nome: nome.trim() },
    })

    return NextResponse.json(categoria, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
