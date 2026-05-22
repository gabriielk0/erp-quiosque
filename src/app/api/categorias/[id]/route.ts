import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { nome } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const categoria = await prisma.menuCategory.update({
      where: { id: Number(params.id) },
      data: { nome: nome.trim() },
    })

    return NextResponse.json(categoria)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    // Verifica se existem produtos associados a esta categoria
    const productsCount = await prisma.produto.count({
      where: { categoriaId: id, ativo: true },
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma categoria que possui produtos ativos associados.' },
        { status: 400 }
      )
    }

    // Se houver algum produto desativado, também vinculamos ao delete?
    // Para simplificar, vamos deletar a categoria se não houver produtos ativos associados,
    // ou simplesmente deletar se não houver produto algum (incluindo inativos).
    // Vamos verificar se há algum produto associado (ativo ou não) para evitar violação de integridade referencial:
    const totalProductsCount = await prisma.produto.count({
      where: { categoriaId: id },
    })

    if (totalProductsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma categoria associada a produtos no sistema.' },
        { status: 400 }
      )
    }

    await prisma.menuCategory.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
