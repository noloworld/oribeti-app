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

// GET - Buscar mensagens do chat
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const mensagens = await prisma.chatMensagem.findMany({
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Marcar mensagens como lidas (exceto as próprias)
    await prisma.chatMensagem.updateMany({
      where: {
        userId: {
          not: user.id
        },
        lida: false
      },
      data: {
        lida: true
      }
    });

    // Buscar usuários que estão escrevendo (excluindo o usuário atual)
    // Limpar typing status antigo (mais de 10 segundos)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    await prisma.user.updateMany({
      where: {
        isTyping: true,
        lastTyping: {
          lt: tenSecondsAgo
        }
      },
      data: {
        isTyping: false
      }
    });

    const usuariosEscrevendo = await prisma.user.findMany({
      where: {
        isTyping: true,
        id: {
          not: user.id
        }
      },
      select: {
        id: true,
        nome: true,
        tipo: true
      }
    });

    return NextResponse.json({
      mensagens: mensagens.reverse(), // Inverter para mostrar mais antigas primeiro
      total: await prisma.chatMensagem.count(),
      usuariosEscrevendo
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Enviar nova mensagem
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mensagem } = await request.json();

    if (!mensagem || mensagem.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Criar mensagem
    const novaMensagem = await prisma.chatMensagem.create({
      data: {
        userId: user.id,
        mensagem: mensagem.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        }
      }
    });

    // Criar notificação para outros usuários
    const outrosUsuarios = await prisma.user.findMany({
      where: {
        id: {
          not: user.id
        }
      },
      select: {
        id: true
      }
    });

    if (outrosUsuarios.length > 0) {
      await prisma.notificacao.createMany({
        data: outrosUsuarios.map(otherUser => ({
          userId: otherUser.id,
          tipo: 'NOVA_MENSAGEM',
          titulo: 'Nova mensagem no chat',
          mensagem: `${user.nome}: ${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}`,
          dadosExtra: {
            mensagemId: novaMensagem.id,
            remetente: user.nome
          }
        }))
      });
    }

    // Parar de escrever após enviar mensagem
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isTyping: false,
        lastTyping: null
      }
    });

    return NextResponse.json(novaMensagem);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar status de typing
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { isTyping } = await request.json();

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isTyping: Boolean(isTyping),
        lastTyping: isTyping ? new Date() : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar typing status:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 