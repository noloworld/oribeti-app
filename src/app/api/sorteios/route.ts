import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sorteios - Lista sorteios ativos
export async function GET() {
  try {
    const sorteios = await prisma.sorteio.findMany({
      where: { encerrado: false },
      orderBy: { dataCriacao: 'desc' },
      include: {
        participacoes: true,
      },
    });
    return NextResponse.json(sorteios);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sorteios' }, { status: 500 });
  }
}

// POST /api/sorteios - Criar novo sorteio
export async function POST(req: NextRequest) {
  try {
    const { nome } = await req.json();
    if (!nome || typeof nome !== 'string') {
      return NextResponse.json({ error: 'Nome do sorteio é obrigatório' }, { status: 400 });
    }
    const sorteio = await prisma.sorteio.create({
      data: { nome },
    });
    return NextResponse.json(sorteio, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar sorteio' }, { status: 500 });
  }
} 