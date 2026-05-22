const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const revenues = await prisma.monthlyRevenue.findMany({
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });
    console.log('--- REVENUES IN DB ---');
    console.log(JSON.stringify(revenues, null, 2));

    const records = await prisma.financialRecord.findMany();
    console.log('--- RECORDS IN DB ---');
    console.log(JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
