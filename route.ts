import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let config = await prisma.configuracaoSistema.findFirst();
    if (!config) {
      config = await prisma.configuracaoSistema.create({
        data: {
          margemLucroPadrao: 0.1823,
          markupPadrao: 2.8,
          cmvMaximo: 0.375,
        },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    // Retorna fallback caso a tabela ainda não exista
    return NextResponse.json({
      margemLucroPadrao: 0.1823,
      markupPadrao: 2.8,
      cmvMaximo: 0.375,
    });
  }
}
