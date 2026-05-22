const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.expenseCategory.create({
      data: {
        nome: 'Despesas Fixas',
        tipo: 'FIXED'
      }
    });
    console.log('Created successfully:', res);
  } catch (err) {
    console.error('Failed to create:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
