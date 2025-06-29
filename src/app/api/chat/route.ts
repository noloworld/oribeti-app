import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Buscar mensagens do chat
export async function GET(request: NextRequest) {
  try {
    // Temporário: usar ID fixo até implementar auth corretamente
    const userId = 1;

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
          not: userId
        },
        lida: false
      },
      data: {
        lida: true
      }
    });

    return NextResponse.json({
      mensagens: mensagens.reverse(), // Inverter para mostrar mais antigas primeiro
      total: await prisma.chatMensagem.count()
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Enviar nova mensagem
export async function POST(request: NextRequest) {
  try {
    // Temporário: usar ID fixo até implementar auth corretamente
    const userId = 1;
    const userName = 'Admin';

    const { mensagem } = await request.json();

    if (!mensagem || mensagem.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Criar mensagem
    const novaMensagem = await prisma.chatMensagem.create({
      data: {
        userId: userId,
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
          not: userId
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
          mensagem: `${userName}: ${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}`,
          dadosExtra: {
            mensagemId: novaMensagem.id,
            remetente: userName
          }
        }))
      });
    }

    return NextResponse.json(novaMensagem);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 