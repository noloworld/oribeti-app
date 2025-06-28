import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sorteios/arquivados - Lista sorteios encerrados
export async function GET() {
  try {
    const sorteios = await prisma.sorteio.findMany({
      where: { encerrado: true },
      orderBy: { dataCriacao: 'desc' },
      include: {
        participacoes: {
          include: { cliente: true },
        },
      },
    });
    return NextResponse.json(sorteios);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sorteios arquivados' }, { status: 500 });
  }
} 