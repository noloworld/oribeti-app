import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Verificar vendas pendentes antigas e criar notificações
export async function POST(request: NextRequest) {
  try {
    // Data limite: 2 meses atrás
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 2);

    // Buscar vendas pendentes antigas
    const vendasAntigas = await prisma.venda.findMany({
      where: {
        status: 'PENDENTE',
        data: {
          lt: dataLimite
        }
      },
      include: {
        cliente: true
      }
    });

    if (vendasAntigas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma venda antiga encontrada' });
    }

    // Buscar todos os usuários para criar notificações
    const usuarios = await prisma.user.findMany({
      select: { id: true }
    });

    const notificacoesExistentes = await prisma.notificacao.findMany({
      where: {
        tipo: 'VENDA_PENDENTE_ANTIGA',
        criadoEm: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    // Criar notificações apenas se não foram criadas nas últimas 24h
    if (notificacoesExistentes.length === 0) {
      const notificacoes = usuarios.flatMap(user => 
        vendasAntigas.map(venda => ({
          userId: user.id,
          tipo: 'VENDA_PENDENTE_ANTIGA',
          titulo: 'Venda Pendente Antiga',
          mensagem: `Venda para ${venda.cliente.nome} está pendente há mais de 2 meses (${venda.data.toLocaleDateString('pt-PT')})`,
          dadosExtra: {
            vendaId: venda.id,
            clienteNome: venda.cliente.nome,
            dataVenda: venda.data.toISOString()
          }
        }))
      );

      await prisma.notificacao.createMany({
        data: notificacoes
      });

      return NextResponse.json({ 
        message: `${notificacoes.length} notificações criadas para ${vendasAntigas.length} vendas antigas`,
        vendasAntigas: vendasAntigas.length
      });
    }

    return NextResponse.json({ 
      message: 'Notificações já foram criadas recentemente',
      vendasAntigas: vendasAntigas.length
    });

  } catch (error) {
    console.error('Erro ao verificar vendas antigas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 