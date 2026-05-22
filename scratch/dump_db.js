const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const categories = await prisma.expenseCategory.findMany({});
    const records = await prisma.financialRecord.findMany({});
    const revenues = await prisma.monthlyRevenue.findMany({});
    console.log('=== CATEGORIES ===');
    console.log(categories);
    console.log('=== RECORDS ===');
    console.log(records);
    console.log('=== REVENUES ===');
    console.log(revenues);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
