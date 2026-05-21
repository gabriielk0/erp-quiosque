import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let config = await prisma.configuracaoSistema.findFirst()
    if (!config) {
      config = await prisma.configuracaoSistema.create({
        data: {
          margemLucroPadrao: 0.1823, // 18.23%
          markupPadrao: 2.8,
          cmvMaximo: 0.375 // 37.5%
        }
      })
    }
    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
