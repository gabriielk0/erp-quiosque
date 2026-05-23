import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(categories, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, tipo, ativo } = body;

    if (!nome || !tipo) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 });
    }

    if (tipo !== 'FIXED' && tipo !== 'VARIABLE') {
      return NextResponse.json({ error: 'Tipo inválido. Deve ser FIXED ou VARIABLE' }, { status: 400 });
    }

    // Check unique constraint
    const existing = await prisma.expenseCategory.findUnique({
      where: { nome },
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome' }, { status: 400 });
    }

    const created = await prisma.expenseCategory.create({
      data: {
        nome,
        tipo,
        ativo: ativo ?? true,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar categoria' }, { status: 500 });
  }
}
