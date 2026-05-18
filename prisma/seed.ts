/**
 * seed.ts — Carga inicial baseada na planilha base_de_dados.xlsx
 *
 * Rodar: npx ts-node prisma/seed.ts
 * ou via package.json: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── 1. INSUMOS (Sheet "Base de Dados", códigos 1-99) ───────────────────
  const insumosData = [
    // Embalagens / descartáveis
    {
      codigo: 1,
      nome: 'SACOLA',
      rsPago: 9,
      volumeEmbalagem: 100,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 2,
      nome: 'EMBALET - GARFO',
      rsPago: 15,
      volumeEmbalagem: 500,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 3,
      nome: 'SAL - SACHE',
      rsPago: 30,
      volumeEmbalagem: 250,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 4,
      nome: 'SACOLA KRAFT G',
      rsPago: 42,
      volumeEmbalagem: 50,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 5,
      nome: 'EMBALAGEM ISOPOR 3 DIVISORIA',
      rsPago: 130,
      volumeEmbalagem: 100,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 6,
      nome: 'EMBALAGEM ISOPOR REDONDO',
      rsPago: 36,
      volumeEmbalagem: 100,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 7,
      nome: 'EMBALAGEM ISOPOR QUADRADO',
      rsPago: 43,
      volumeEmbalagem: 100,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 8,
      nome: 'EMBALAGEM ISOPOR HAMBURGUEIRA',
      rsPago: 26,
      volumeEmbalagem: 100,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 9,
      nome: 'PAPEL HAMBURGUES',
      rsPago: 35,
      volumeEmbalagem: 400,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 10,
      nome: 'COPO SALADA',
      rsPago: 2,
      volumeEmbalagem: 50,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 11,
      nome: 'COLHER GARFO DESCARTAVEL',
      rsPago: 15,
      volumeEmbalagem: 50,
      unidadeMedida: 'Unid',
    },
    // Proteínas
    {
      codigo: 14,
      nome: 'PROTEINA FRANGO COXA',
      rsPago: 10,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 15,
      nome: 'PROTEINA ALCATRA',
      rsPago: 43,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 16,
      nome: 'PROTEINA PEITO DE FRANGO',
      rsPago: 14.88,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 17,
      nome: 'PROTEINA TILAPIA',
      rsPago: 45.9,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 18,
      nome: 'PROTEINA BISTECA',
      rsPago: 11.95,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 19,
      nome: 'PROTEINA COZIDA',
      rsPago: 30,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 20,
      nome: 'PROTEINA DE SOL',
      rsPago: 40,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    // Carboidratos / vegetais
    {
      codigo: 22,
      nome: 'ARROZ',
      rsPago: 17,
      volumeEmbalagem: 5,
      unidadeMedida: 'KG',
    },
    {
      codigo: 23,
      nome: 'FEIJAO',
      rsPago: 7,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 24,
      nome: 'BATATA PALITO',
      rsPago: 24,
      volumeEmbalagem: 2,
      unidadeMedida: 'KG',
    },
    {
      codigo: 25,
      nome: 'BATATA COZIDA',
      rsPago: 2.5,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 26,
      nome: 'MANDIOCA',
      rsPago: 8,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 28,
      nome: 'BATATA PALITO MCAIN',
      rsPago: 27,
      volumeEmbalagem: 1.5,
      unidadeMedida: 'KG',
    },
    {
      codigo: 29,
      nome: 'FRANGO A PASSARINHO',
      rsPago: 9.99,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 30,
      nome: 'BACON',
      rsPago: 30,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 31,
      nome: 'LINGUIÇA CALABRESA',
      rsPago: 16,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 32,
      nome: 'QUEIJO MUSSARELA',
      rsPago: 25,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 33,
      nome: 'CARNE DE SOL',
      rsPago: 40,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 35,
      nome: 'MASSA DO QUIBE',
      rsPago: 0.3,
      volumeEmbalagem: 1,
      unidadeMedida: 'Unid',
    },
    {
      codigo: 37,
      nome: 'OLEO',
      rsPago: 7,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 38,
      nome: 'SAL',
      rsPago: 2.5,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 39,
      nome: 'ALHO',
      rsPago: 16,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
    {
      codigo: 40,
      nome: 'CARNE MOIDA',
      rsPago: 28,
      volumeEmbalagem: 1,
      unidadeMedida: 'KG',
    },
  ];

  for (const insumo of insumosData) {
    await prisma.insumo.upsert({
      where: { codigo: insumo.codigo },
      update: insumo,
      create: insumo,
    });
  }
  console.log(`✅ ${insumosData.length} insumos inseridos`);

  // ─── 2. DESPESAS (Sheet "Despesas") ──────────────────────────────────────
  await prisma.despesa.deleteMany(); // limpa antes de reinserir

  const despesasFixas = [
    { descricao: 'LUZ', valor: 1000 },
    { descricao: 'ÁGUA', valor: 0 },
    { descricao: 'GÁS', valor: 440 },
    { descricao: 'TAXA', valor: 1800 },
    { descricao: 'ALUGUEL', valor: 2000 },
    { descricao: 'SISTEMA', valor: 150 },
    { descricao: 'INTERNET', valor: 100 },
    { descricao: 'MAQUINA', valor: 87 },
    { descricao: 'FUNCIONARIOS', valor: 1800 },
    { descricao: 'GELO', valor: 28 },
    { descricao: 'GASOLINA', valor: 800 },
    { descricao: 'ALIMENTAÇÃO DE FUNCIONÁRIOS', valor: 1900 },
    { descricao: 'MATERIAL DE LIMPEZA', valor: 100 },
    { descricao: 'CONTADOR', valor: 400 },
    { descricao: 'MÚSICA', valor: 600 },
  ];

  // Despesas variáveis em % do faturamento
  const despesasVariaveis = [
    { descricao: 'SIMPLES NACIONAL', valor: 4.5 }, // 4.5%
    { descricao: 'METODO DE PAGAMENTO', valor: 1.7 }, // 1.7%
  ];

  await prisma.despesa.createMany({
    data: [
      ...despesasFixas.map((d) => ({ ...d, tipo: 'fixa' as const })),
      ...despesasVariaveis.map((d) => ({ ...d, tipo: 'variavel' as const })),
    ],
  });
  console.log(
    `✅ ${despesasFixas.length} despesas fixas + ${despesasVariaveis.length} variáveis inseridas`,
  );

  // ─── 3. PRODUTOS + FICHAS TÉCNICAS ───────────────────────────────────────
  // Primeiro inserimos os "insumos preparados" (cod 100+) como produtos
  // pois a planilha os usa como ingredientes em outras fichas

  // Buscamos IDs dos insumos para montar os relacionamentos
  const insumos = await prisma.insumo.findMany();
  const ins = (codigo: number) => {
    const i = insumos.find((i) => i.codigo === codigo);
    if (!i) throw new Error(`Insumo código ${codigo} não encontrado`);
    return i.id;
  };

  const produtosData = [
    // ── PREPARAÇÕES BASE (usadas como ingredientes em outras fichas) ──
    {
      codigo: 100,
      nome: 'ARROZ COZIDO',
      categoria: 'Base',
      rendimentoPorcoes: new Decimal('3.717'), // rende 3,717 KG
      precoVenda: null,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 22, qtdBruta: 2, medidaCaseira: '', fatorCorrecao: 1.8 },
        { codigo: 31, qtdBruta: 0.02, medidaCaseira: '' },
        { codigo: 37, qtdBruta: 0.015, medidaCaseira: '' },
        { codigo: 38, qtdBruta: 0.015, medidaCaseira: '' },
        { codigo: 39, qtdBruta: 0.015, medidaCaseira: '' },
      ],
    },
    {
      codigo: 101,
      nome: 'FEIJAO COZIDO',
      categoria: 'Base',
      rendimentoPorcoes: new Decimal('5'),
      precoVenda: null,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 23, qtdBruta: 1, medidaCaseira: '' },
        { codigo: 31, qtdBruta: 0.02, medidaCaseira: '' },
        { codigo: 37, qtdBruta: 0.015, medidaCaseira: '' },
        { codigo: 38, qtdBruta: 0.015, medidaCaseira: '' },
        { codigo: 39, qtdBruta: 0.015, medidaCaseira: '' },
      ],
    },

    // ── SALÃO / MARMITAS (disponíveis nos 2 canais: salão + iFood) ────
    // precoVenda = salão | precoIfood = iFood (pode ser diferente)
    // disponivelIfood = true → aparece no PDV iFood também
    {
      codigo: 201,
      nome: 'FRANGO GRELHADO',
      categoria: 'Salão',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('22'),
      precoIfood: new Decimal('12'),
      disponivelIfood: true,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 16, qtdBruta: 0.17, medidaCaseira: '170g' },
        { codigo: 24, qtdBruta: 0.1, medidaCaseira: '100g' },
        { codigo: 22, qtdBruta: 0.2, medidaCaseira: '200g' },
        { codigo: 23, qtdBruta: 0.2, medidaCaseira: '200g' },
      ],
    },
    {
      codigo: 202,
      nome: 'ALCATRA',
      categoria: 'Salão',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('24'),
      precoIfood: new Decimal('24'),
      disponivelIfood: true,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 15, qtdBruta: 0.175, medidaCaseira: '175g' },
        { codigo: 24, qtdBruta: 0.1, medidaCaseira: '100g' },
        { codigo: 22, qtdBruta: 0.2, medidaCaseira: '200g' },
        { codigo: 23, qtdBruta: 0.2, medidaCaseira: '200g' },
      ],
    },
    {
      codigo: 203,
      nome: 'TILAPIA',
      categoria: 'Salão',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('29'),
      precoIfood: new Decimal('29'),
      disponivelIfood: true,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 17, qtdBruta: 0.175, medidaCaseira: '175g' },
        { codigo: 24, qtdBruta: 0.1, medidaCaseira: '100g' },
        { codigo: 22, qtdBruta: 0.2, medidaCaseira: '200g' },
        { codigo: 23, qtdBruta: 0.2, medidaCaseira: '200g' },
      ],
    },
    {
      codigo: 204,
      nome: 'BISTECA',
      categoria: 'Salão',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('22'),
      precoIfood: new Decimal('22'),
      disponivelIfood: true,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 18, qtdBruta: 0.19, medidaCaseira: '190g' },
        { codigo: 24, qtdBruta: 0.1, medidaCaseira: '100g' },
        { codigo: 22, qtdBruta: 0.18, medidaCaseira: '180g' },
        { codigo: 23, qtdBruta: 0.2, medidaCaseira: '200g' },
      ],
    },
    {
      codigo: 205,
      nome: 'CARNE COZIDA',
      categoria: 'Salão',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('20'),
      precoIfood: new Decimal('20'),
      disponivelIfood: true,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 19, qtdBruta: 0.214, medidaCaseira: '214g' },
        { codigo: 26, qtdBruta: 0.1, medidaCaseira: '100g' },
        { codigo: 22, qtdBruta: 0.2, medidaCaseira: '200g' },
        { codigo: 23, qtdBruta: 0.2, medidaCaseira: '200g' },
      ],
    },

    // ── PETISCOS (iFood = false por padrão, ajustar conforme necessário) ─
    {
      codigo: 301,
      nome: 'FRANGO A PASSARINHO',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('29'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [{ codigo: 29, qtdBruta: 0.75, medidaCaseira: '750g' }],
    },
    {
      codigo: 302,
      nome: 'MANDIOCA SIMPLES',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('28'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [{ codigo: 26, qtdBruta: 0.45, medidaCaseira: '450g' }],
    },
    {
      codigo: 303,
      nome: 'MANDIOCA COMPLETA',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('35'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 26, qtdBruta: 0.45, medidaCaseira: '450g' },
        { codigo: 30, qtdBruta: 0.06, medidaCaseira: '60g' },
        { codigo: 32, qtdBruta: 0.06, medidaCaseira: '60g' },
      ],
    },
    {
      codigo: 304,
      nome: 'BATATA SIMPLES',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('27'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [{ codigo: 28, qtdBruta: 0.45, medidaCaseira: '450g' }],
    },
    {
      codigo: 305,
      nome: 'BATATA COMPLETA',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('35'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 28, qtdBruta: 0.45, medidaCaseira: '450g' },
        { codigo: 30, qtdBruta: 0.06, medidaCaseira: '60g' },
        { codigo: 32, qtdBruta: 0.06, medidaCaseira: '60g' },
      ],
    },
    {
      codigo: 306,
      nome: 'ISCA DE TILAPIA',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('48'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [{ codigo: 17, qtdBruta: 0.37, medidaCaseira: '370g' }],
    },
    {
      codigo: 307,
      nome: 'QUIBE DE QUEIJO',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('70'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 35, qtdBruta: 1, medidaCaseira: '1 un' },
        { codigo: 32, qtdBruta: 0.006, medidaCaseira: '6g' },
      ],
    },
    {
      codigo: 308,
      nome: 'CARNE DE SOL C/ QUEIJO',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('75'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 33, qtdBruta: 0.45, medidaCaseira: '450g' },
        { codigo: 32, qtdBruta: 0.06, medidaCaseira: '60g' },
        { codigo: 26, qtdBruta: 0.4, medidaCaseira: '400g' },
      ],
    },
    {
      codigo: 309,
      nome: 'CARNE DE SOL C/ BATATA',
      categoria: 'Petisco',
      rendimentoPorcoes: new Decimal('1'),
      precoVenda: new Decimal('24'),
      precoIfood: null,
      disponivelIfood: false,
      margemSeguranca: new Decimal('10'),
      insumos: [
        { codigo: 20, qtdBruta: 0.13, medidaCaseira: '130g' },
        { codigo: 24, qtdBruta: 0.13, medidaCaseira: '130g' },
      ],
    },
  ];

  for (const p of produtosData) {
    const { insumos: insumosReceita, ...produtoFields } = p;

    const produto = await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: { ...produtoFields },
      create: { ...produtoFields },
    });

    // remove ingredientes antigos antes de reinserir
    await prisma.produtoInsumo.deleteMany({ where: { produtoId: produto.id } });

    for (const ingrediente of insumosReceita) {
      const { codigo: codIns, qtdBruta, medidaCaseira } = ingrediente as any;
      const fatorCorrecao = (ingrediente as any).fatorCorrecao;
      await prisma.produtoInsumo.create({
        data: {
          produtoId: produto.id,
          insumoId: ins(codIns),
          qtdBruta: new Decimal(qtdBruta),
          fatorCorrecao: fatorCorrecao ? new Decimal(fatorCorrecao) : null,
          medidaCaseira: medidaCaseira ?? null,
        },
      });
    }
  }
  console.log(
    `✅ ${produtosData.length} produtos com fichas técnicas inseridos`,
  );

  // ─── 4. FATURAMENTO MENSAL (Sheet Despesas) ──────────────────────────────
  const faturamentos = [
    { mes: 3, valor: 80000 },
    { mes: 4, valor: 81333.33 },
    { mes: 5, valor: 76333.33 },
    { mes: 6, valor: 71333.33 },
    { mes: 7, valor: 66333.33 },
    { mes: 8, valor: 61333.33 },
    { mes: 9, valor: 56333.33 },
    { mes: 10, valor: 51333.33 },
    { mes: 11, valor: 46333.33 },
    { mes: 12, valor: 41333.33 },
  ];

  const anoAtual = new Date().getFullYear();
  for (const f of faturamentos) {
    await prisma.faturamentoMensal.upsert({
      where: { ano_mes: { ano: anoAtual, mes: f.mes } },
      update: { valor: new Decimal(f.valor) },
      create: { ano: anoAtual, mes: f.mes, valor: new Decimal(f.valor) },
    });
  }
  console.log(`✅ ${faturamentos.length} registros de faturamento inseridos`);

  console.log('\n🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
