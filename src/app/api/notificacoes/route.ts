import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';

function getUserFromRequest(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/auth-token=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
}

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const naoLidas = searchParams.get('naoLidas') === 'true';

    const where = naoLidas ? { userId: user.id, lida: false } : { userId: user.id };

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: {
        criadoEm: 'desc'
      },
      take: 50
    });

    const totalNaoLidas = await prisma.notificacao.count({
      where: {
        userId: user.id,
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
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { ids, marcarTodasLidas } = await request.json();

    if (marcarTodasLidas) {
      await prisma.notificacao.updateMany({
        where: {
          userId: user.id,
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
          userId: user.id
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