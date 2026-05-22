import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando faturamentos e metas no banco de dados ---');
  const revenues = await prisma.monthlyRevenue.findMany();
  console.log('Revenues:', JSON.stringify(revenues, null, 2));

  console.log('--- Buscando records no banco de dados ---');
  const records = await prisma.financialRecord.findMany();
  console.log('Records:', JSON.stringify(records, null, 2));

  console.log('--- Buscando categorias no banco de dados ---');
  const categories = await prisma.expenseCategory.findMany();
  console.log('Categories:', JSON.stringify(categories, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
