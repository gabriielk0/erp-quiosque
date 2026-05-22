import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Initial manual state with values
    console.log('--- Phase 1: Set manual mode true with values 37.37 and 6.90 ---');
    let upserted = await prisma.monthlyRevenue.upsert({
      where: { ano_mes: { ano: 2026, mes: 5 } },
      update: {
        faturamento: 0,
        cmvMeta: 0.375,
        lucroMeta: 0.1823,
        despesasFixasMeta: 0.3737,
        despesasVariaveisMeta: 0.069,
        markupMeta: 1.25,
        useManualMarkup: true
      },
      create: {
        ano: 2026,
        mes: 5,
        faturamento: 0,
        cmvMeta: 0.375,
        lucroMeta: 0.1823,
        despesasFixasMeta: 0.3737,
        despesasVariaveisMeta: 0.069,
        markupMeta: 1.25,
        useManualMarkup: true
      }
    });
    console.log('DB after Phase 1:', {
      despesasFixasMeta: Number(upserted.despesasFixasMeta),
      despesasVariaveisMeta: Number(upserted.despesasVariaveisMeta),
      useManualMarkup: upserted.useManualMarkup
    });

    // 2. Uncheck manual mode, preserving existing values
    console.log('--- Phase 2: Uncheck manual mode, preserving values in query ---');
    upserted = await prisma.monthlyRevenue.upsert({
      where: { ano_mes: { ano: 2026, mes: 5 } },
      update: {
        despesasFixasMeta: 0.3737,
        despesasVariaveisMeta: 0.0690,
        useManualMarkup: false
      },
      create: {
        ano: 2026,
        mes: 5,
        faturamento: 0,
        despesasFixasMeta: 0.3737,
        despesasVariaveisMeta: 0.0690,
        useManualMarkup: false
      }
    });
    console.log('DB after Phase 2:', {
      despesasFixasMeta: Number(upserted.despesasFixasMeta),
      despesasVariaveisMeta: Number(upserted.despesasVariaveisMeta),
      useManualMarkup: upserted.useManualMarkup
    });

    // 3. Fetch from DB
    console.log('--- Phase 3: Fetching row ---');
    const fetched = await prisma.monthlyRevenue.findUnique({
      where: { ano_mes: { ano: 2026, mes: 5 } }
    });
    if (fetched) {
      console.log('DB fetched:', {
        despesasFixasMeta: fetched.despesasFixasMeta !== null ? Number(fetched.despesasFixasMeta) : null,
        despesasVariaveisMeta: fetched.despesasVariaveisMeta !== null ? Number(fetched.despesasVariaveisMeta) : null,
        useManualMarkup: fetched.useManualMarkup
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
