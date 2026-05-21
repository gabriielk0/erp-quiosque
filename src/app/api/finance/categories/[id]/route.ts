import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { nome, tipo, ativo } = body;

    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Check unique constraint if name is changing
    if (nome && nome !== existingCategory.nome) {
      const dupe = await prisma.expenseCategory.findUnique({
        where: { nome },
      });
      if (dupe) {
        return NextResponse.json({ error: 'Já existe outra categoria com este nome' }, { status: 400 });
      }
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        nome: nome ?? undefined,
        tipo: tipo ?? undefined,
        ativo: ativo !== undefined ? ativo : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Since onDelete: Cascade is configured, deleting category will delete all associated records
    await prisma.expenseCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir categoria' }, { status: 500 });
  }
}
