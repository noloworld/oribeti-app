import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    if (user.tipo !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem ver logs.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.log.count(),
      prisma.log.findMany({
        orderBy: { data: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          userEmail: true,
          acao: true,
          detalhes: true,
          data: true,
        },
      })
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar logs.' }, { status: 500 });
  }
} 