import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

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
          lucroMeta: Number(revenue.lucroMeta) * 100,
          despesasFixasMeta: revenue.despesasFixasMeta !== null ? Number(revenue.despesasFixasMeta) * 100 : null,
          despesasVariaveisMeta: revenue.despesasVariaveisMeta !== null ? Number(revenue.despesasVariaveisMeta) * 100 : null,
          markupMeta: revenue.markupMeta !== null ? Number(revenue.markupMeta) : null
        }, { headers: noCacheHeaders });
      }

      return NextResponse.json({ 
        faturamento: 0, 
        cmvMeta: 37.5, 
        lucroMeta: 18.23, 
        despesasFixasMeta: null, 
        despesasVariaveisMeta: null, 
        markupMeta: null, 
        useManualMarkup: false, 
        ano, 
        mes 
      }, { headers: noCacheHeaders });
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
      lucroMeta: Number(r.lucroMeta) * 100,
      despesasFixasMeta: r.despesasFixasMeta !== null ? Number(r.despesasFixasMeta) * 100 : null,
      despesasVariaveisMeta: r.despesasVariaveisMeta !== null ? Number(r.despesasVariaveisMeta) * 100 : null,
      markupMeta: r.markupMeta !== null ? Number(r.markupMeta) : null
    }));

    return NextResponse.json(mapped, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Error fetching monthly revenue:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar faturamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Operação em lote (bulk)
    if (Array.isArray(body)) {
      console.log('API Revenue POST bulk recebido. Total de itens:', body.length);
      
      const results = await prisma.$transaction(
        body.map((item, idx) => {
          const parsedAno = parseInt(item.ano);
          const parsedMes = parseInt(item.mes);
          const parsedFaturamento = parseFloat(item.faturamento) || 0;
          
          const parsedCmv = (item.cmvMeta !== undefined && item.cmvMeta !== null)
            ? parseFloat(item.cmvMeta) / 100 : 0.3750;
          const parsedLucro = (item.lucroMeta !== undefined && item.lucroMeta !== null)
            ? parseFloat(item.lucroMeta) / 100 : 0.1823;
          
          const parsedDF = (item.despesasFixasMeta !== undefined && item.despesasFixasMeta !== null)
            ? parseFloat(item.despesasFixasMeta) / 100
            : null;
          const parsedDV = (item.despesasVariaveisMeta !== undefined && item.despesasVariaveisMeta !== null)
            ? parseFloat(item.despesasVariaveisMeta) / 100
            : null;
          const parsedMarkup = (item.markupMeta !== undefined && item.markupMeta !== null)
            ? parseFloat(item.markupMeta)
            : null;

          if (item.useManualMarkup && idx === parsedMes - 1) {
            console.log(`Mês ${parsedMes} em Modo Manual. Gravando metas: Lucro=${parsedLucro}, CMV=${parsedCmv}, DF=${parsedDF}, DV=${parsedDV}, Markup=${parsedMarkup}`);
          }

          return prisma.monthlyRevenue.upsert({
            where: {
              ano_mes: {
                ano: parsedAno,
                mes: parsedMes
              }
            },
            update: {
              faturamento: parsedFaturamento,
              cmvMeta: parsedCmv,
              lucroMeta: parsedLucro,
              despesasFixasMeta: parsedDF,
              despesasVariaveisMeta: parsedDV,
              markupMeta: parsedMarkup,
              useManualMarkup: item.useManualMarkup ?? false
            },
            create: {
              ano: parsedAno,
              mes: parsedMes,
              faturamento: parsedFaturamento,
              cmvMeta: parsedCmv,
              lucroMeta: parsedLucro,
              despesasFixasMeta: parsedDF,
              despesasVariaveisMeta: parsedDV,
              markupMeta: parsedMarkup,
              useManualMarkup: item.useManualMarkup ?? false
            }
          });
        })
      );

      return NextResponse.json({
        success: true,
        count: results.length,
        data: results.map(r => ({
          ...r,
          faturamento: Number(r.faturamento),
          cmvMeta: Number(r.cmvMeta) * 100,
          lucroMeta: Number(r.lucroMeta) * 100,
          despesasFixasMeta: r.despesasFixasMeta !== null ? Number(r.despesasFixasMeta) * 100 : null,
          despesasVariaveisMeta: r.despesasVariaveisMeta !== null ? Number(r.despesasVariaveisMeta) * 100 : null,
          markupMeta: r.markupMeta !== null ? Number(r.markupMeta) : null
        }))
      });
    }

    // Operação individual
    const { 
      ano, 
      mes, 
      faturamento, 
      cmvMeta, 
      lucroMeta, 
      despesasFixasMeta, 
      despesasVariaveisMeta, 
      markupMeta, 
      useManualMarkup 
    } = body;

    if (ano === undefined || mes === undefined || faturamento === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const parsedAno = parseInt(ano);
    const parsedMes = parseInt(mes);
    const parsedFaturamento = parseFloat(faturamento);
    const parsedCmv = (cmvMeta !== undefined && cmvMeta !== null) ? parseFloat(cmvMeta) / 100 : 0.3750;
    const parsedLucro = (lucroMeta !== undefined && lucroMeta !== null) ? parseFloat(lucroMeta) / 100 : 0.1823;
    const parsedDF = (despesasFixasMeta !== undefined && despesasFixasMeta !== null)
      ? parseFloat(despesasFixasMeta) / 100
      : null;
    const parsedDV = (despesasVariaveisMeta !== undefined && despesasVariaveisMeta !== null)
      ? parseFloat(despesasVariaveisMeta) / 100
      : null;
    const parsedMarkup = (markupMeta !== undefined && markupMeta !== null)
      ? parseFloat(markupMeta)
      : null;

    if (isNaN(parsedAno) || isNaN(parsedMes) || isNaN(parsedFaturamento)) {
      return NextResponse.json({ error: 'Valores numéricos inválidos' }, { status: 400 });
    }

    console.log(`API Revenue POST individual recebido para ${parsedMes}/${parsedAno}. Gravando metas: Lucro=${parsedLucro}, CMV=${parsedCmv}, DF=${parsedDF}, DV=${parsedDV}`);

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
        lucroMeta: parsedLucro,
        despesasFixasMeta: parsedDF,
        despesasVariaveisMeta: parsedDV,
        markupMeta: parsedMarkup,
        useManualMarkup: useManualMarkup || false
      },
      create: {
        ano: parsedAno,
        mes: parsedMes,
        faturamento: parsedFaturamento,
        cmvMeta: parsedCmv,
        lucroMeta: parsedLucro,
        despesasFixasMeta: parsedDF,
        despesasVariaveisMeta: parsedDV,
        markupMeta: parsedMarkup,
        useManualMarkup: useManualMarkup || false
      }
    });

    return NextResponse.json({
      ...upserted,
      faturamento: Number(upserted.faturamento),
      cmvMeta: Number(upserted.cmvMeta) * 100,
      lucroMeta: Number(upserted.lucroMeta) * 100,
      despesasFixasMeta: upserted.despesasFixasMeta !== null ? Number(upserted.despesasFixasMeta) * 100 : null,
      despesasVariaveisMeta: upserted.despesasVariaveisMeta !== null ? Number(upserted.despesasVariaveisMeta) * 100 : null,
      markupMeta: upserted.markupMeta !== null ? Number(upserted.markupMeta) : null
    });
  } catch (error: any) {
    console.error('Error upserting monthly revenue:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar faturamento' }, { status: 500 });
  }
}
