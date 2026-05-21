import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const anoStr = searchParams.get('ano');
    const mesStr = searchParams.get('mes');

    if (anoStr && mesStr) {
      const ano = parseInt(anoStr);
      const mes = parseInt(mesStr);

      if (isNaN(ano) || isNaN(mes)) {
        return NextResponse.json({ error: 'Ano ou mês inválidos' }, { status: 400 });
      }

      const revenue = await prisma.monthlyRevenue.findUnique({
        where: {
          ano_mes: { ano, mes }
        }
      });

      if (revenue) {
        return NextResponse.json({
          ...revenue,
          faturamento: Number(revenue.faturamento),
          cmvMeta: Number(revenue.cmvMeta) * 100,
          lucroMeta: Number(revenue.lucroMeta) * 100
        });
      }

      return NextResponse.json({ faturamento: 0, cmvMeta: 35, lucroMeta: 20, ano, mes });
    }

    const revenues = await prisma.monthlyRevenue.findMany({
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });

    const mapped = revenues.map(r => ({
      ...r,
      faturamento: Number(r.faturamento),
      cmvMeta: Number(r.cmvMeta) * 100,
      lucroMeta: Number(r.lucroMeta) * 100
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Error fetching monthly revenue:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar faturamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ano, mes, faturamento, cmvMeta, lucroMeta } = body;

    if (ano === undefined || mes === undefined || faturamento === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const parsedAno = parseInt(ano);
    const parsedMes = parseInt(mes);
    const parsedFaturamento = parseFloat(faturamento);
    const parsedCmv = cmvMeta !== undefined ? parseFloat(cmvMeta) / 100 : 0.35;
    const parsedLucro = lucroMeta !== undefined ? parseFloat(lucroMeta) / 100 : 0.20;

    if (isNaN(parsedAno) || isNaN(parsedMes) || isNaN(parsedFaturamento)) {
      return NextResponse.json({ error: 'Valores numéricos inválidos' }, { status: 400 });
    }

    const upserted = await prisma.monthlyRevenue.upsert({
      where: {
        ano_mes: {
          ano: parsedAno,
          mes: parsedMes
        }
      },
      update: {
        faturamento: parsedFaturamento,
        cmvMeta: parsedCmv,
        lucroMeta: parsedLucro
      },
      create: {
        ano: parsedAno,
        mes: parsedMes,
        faturamento: parsedFaturamento,
        cmvMeta: parsedCmv,
        lucroMeta: parsedLucro
      }
    });

    return NextResponse.json({
      ...upserted,
      faturamento: Number(upserted.faturamento),
      cmvMeta: Number(upserted.cmvMeta) * 100,
      lucroMeta: Number(upserted.lucroMeta) * 100
    });
  } catch (error: any) {
    console.error('Error upserting monthly revenue:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar faturamento' }, { status: 500 });
  }
}
