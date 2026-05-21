import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const id = +params.id

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get the sale items and their products' ingredients
      const venda = await tx.venda.findUnique({
        where: { id },
        include: {
          itens: {
            include: {
              produto: {
                include: {
                  insumos: true
                }
              }
            }
          }
        }
      })

      if (!venda) {
        throw new Error('Venda não encontrada')
      }

      // 2. Revert stock for each insumo used in the sale
      for (const item of venda.itens) {
        if (item.produtoId && item.produto) {
          for (const pi of item.produto.insumos) {
            const estorno = Number(pi.qtdBruta) * item.quantidade
            await tx.insumo.update({
              where: { id: pi.insumoId },
              data: { estoqueAtual: { increment: estorno } }
            })
          }
        } else if (item.insumoId) {
          await tx.insumo.update({
            where: { id: item.insumoId },
            data: { estoqueAtual: { increment: item.quantidade } }
          })
        }
      }

      // 3. Delete the sale itself (will cascade delete items)
      await tx.venda.delete({
        where: { id }
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
