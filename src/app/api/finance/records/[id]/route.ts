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
    const { descricao, valor, ano, mes, categoriaId } = body;

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: {
        descricao: descricao ?? undefined,
        valor: valor ?? undefined,
        ano: ano ?? undefined,
        mes: mes ?? undefined,
        categoriaId: categoriaId ?? undefined,
      },
      include: {
        categoria: true
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating financial record:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar lançamento' }, { status: 500 });
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

    await prisma.financialRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting financial record:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir lançamento' }, { status: 500 });
  }
}
