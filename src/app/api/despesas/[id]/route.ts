import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const updated = await prisma.despesa.update({
    where: { id: Number(params.id) },
    data: {
      descricao: body.descricao,
      tipo: body.tipo,
      valor: body.valor,
      ativo: body.ativo,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.despesa.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ success: true });
}
