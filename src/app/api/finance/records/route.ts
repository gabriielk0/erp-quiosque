import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const anoStr = searchParams.get('ano');
    const mesStr = searchParams.get('mes');

    const where: any = {};
    if (anoStr) {
      const ano = parseInt(anoStr);
      if (!isNaN(ano)) where.ano = ano;
    }
    if (mesStr) {
      const mes = parseInt(mesStr);
      if (!isNaN(mes)) where.mes = mes;
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        categoria: true,
      },
      orderBy: [
        { categoria: { tipo: 'asc' } },
        { categoria: { nome: 'asc' } },
        { descricao: 'asc' }
      ]
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching financial records:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support bulk operation if body is an array
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      // Check if all items have the same year and month to allow safe deletion/rewrite
      const { ano, mes } = body[0];
      if (typeof ano !== 'number' || typeof mes !== 'number') {
        return NextResponse.json({ error: 'Ano e mês inválidos na carga' }, { status: 400 });
      }

      const allSamePeriod = body.every(item => item.ano === ano && item.mes === mes);
      if (!allSamePeriod) {
        return NextResponse.json({ error: 'Todos os itens em lote devem pertencer ao mesmo ano e mês' }, { status: 400 });
      }

      // Validate all items
      for (const item of body) {
        if (!item.descricao || typeof item.valor !== 'number' || !item.categoriaId) {
          return NextResponse.json({ error: 'Campos obrigatórios ausentes em algum item do lote' }, { status: 400 });
        }
      }

      // Execute transaction: delete existing records for this month and recreate them
      const result = await prisma.$transaction(async (tx) => {
        await tx.financialRecord.deleteMany({
          where: { ano, mes },
        });

        const created = await Promise.all(
          body.map(item =>
            tx.financialRecord.create({
              data: {
                descricao: item.descricao,
                valor: item.valor,
                ano: item.ano,
                mes: item.mes,
                categoriaId: item.categoriaId,
              },
            })
          )
        );
        return created;
      });

      return NextResponse.json({ success: true, count: result.length, data: result });
    }

    // Single item creation
    const { descricao, valor, ano, mes, categoriaId } = body;

    if (!descricao || valor === undefined || !ano || !mes || !categoriaId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const created = await prisma.financialRecord.create({
      data: {
        descricao,
        valor,
        ano,
        mes,
        categoriaId,
      },
      include: {
        categoria: true
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating financial record:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar lançamento' }, { status: 500 });
  }
}
