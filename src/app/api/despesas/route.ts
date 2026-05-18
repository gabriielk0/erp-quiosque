import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id))
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Busca a venda e seus itens para devolver ao estoque
      const venda = await tx.venda.findUnique({
        where: { id },
        include: {
          itens: { include: { produto: { include: { insumos: true } } } },
        },
      });

      if (!venda) throw new Error('Venda não encontrada');

      // 2. Itera sobre os insumos (Ficha Técnica) para devolver a qtdBruta ao estoqueAtual
      for (const item of venda.itens) {
        if (!item.produto) continue;
        for (const pi of item.produto.insumos) {
          const devolucao = Number(pi.qtdBruta) * item.quantidade;
          await tx.insumo.update({
            where: { id: pi.insumoId },
            data: { estoqueAtual: { increment: devolucao } },
          });
        }
      }

      // 3. Exclui a venda (Prisma apagará os Itens da Venda em cascata)
      await tx.venda.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na exclusão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
