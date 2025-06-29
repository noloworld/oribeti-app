import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    // Temporário: usar ID fixo até implementar auth
    const userId = 1;

    const { searchParams } = new URL(request.url);
    const naoLidas = searchParams.get('naoLidas') === 'true';

    const where = naoLidas ? { userId, lida: false } : { userId };

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: {
        criadoEm: 'desc'
      },
      take: 50
    });

    const totalNaoLidas = await prisma.notificacao.count({
      where: {
        userId,
        lida: false
      }
    });

    return NextResponse.json({
      notificacoes,
      totalNaoLidas
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Marcar notificações como lidas
export async function PUT(request: NextRequest) {
  try {
    // Temporário: usar ID fixo até implementar auth
    const userId = 1;

    const { ids, marcarTodasLidas } = await request.json();

    if (marcarTodasLidas) {
      await prisma.notificacao.updateMany({
        where: {
          userId,
          lida: false
        },
        data: {
          lida: true
        }
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.notificacao.updateMany({
        where: {
          id: {
            in: ids
          },
          userId
        },
        data: {
          lida: true
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 