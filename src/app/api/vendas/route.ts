import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Paginação
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all');
    if (all === 'true') {
      // Retorna todas as vendas sem paginação
      const vendasRaw = await prisma.venda.findMany({
        include: {
          cliente: { select: { id: true, nome: true } },
          pagamentos: true,
        },
        orderBy: { data: 'desc' },
      });
      const vendas = vendasRaw.map(v => ({
        ...v,
        numPagamentos: v.pagamentos.length,
        pagamentos: v.pagamentos
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, 1),
      }));
      return NextResponse.json({ vendas, total: vendas.length });
    }
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Filtros e busca podem ser adicionados aqui se necessário

    const [total, vendasRaw] = await Promise.all([
      prisma.venda.count(),
      prisma.venda.findMany({
        include: {
          cliente: { select: { id: true, nome: true } },
          pagamentos: true, // pega todos para contar
        },
        orderBy: { data: 'desc' },
        skip,
        take: limit,
      })
    ]);
    // Para cada venda, manter apenas o pagamento mais recente em pagamentos, mas adicionar numPagamentos
    const vendas = vendasRaw.map(v => ({
      ...v,
      numPagamentos: v.pagamentos.length,
      pagamentos: v.pagamentos
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 1),
    }));
    return NextResponse.json({ vendas, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar vendas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { clienteId, nomeProduto, valorRevista, valorFinal, valorPago, observacoes, data, status } = body;
    if (!clienteId || !nomeProduto || !valorRevista || !valorFinal || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: clienteId, nomeProduto, valorRevista, valorFinal, data.' }, { status: 400 });
    }
    
    // Calcular status automaticamente baseado no valor pago
    const valorPagoNum = Number(valorPago || 0);
    const valorFinalNum = Number(valorFinal);
    const statusAutomatico = valorPagoNum >= valorFinalNum ? 'PAGO' : 'PENDENTE';
    
    const venda = await prisma.venda.create({
      data: {
        clienteId: Number(clienteId),
        nomeProduto,
        valorRevista: Number(valorRevista),
        valorFinal: valorFinalNum,
        valorPago: valorPagoNum,
        observacoes: observacoes || null,
        data: new Date(data),
        status: statusAutomatico,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        pagamentos: true,
      },
    });

    // Se há valor pago, criar o primeiro pagamento
    if (valorPagoNum > 0) {
      await prisma.pagamento.create({
        data: {
          vendaId: venda.id,
          valor: valorPagoNum,
          data: new Date(data),
          observacoes: observacoes || null,
        },
      });
    }

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: 'CRIAR_VENDA',
        detalhes: `Venda "${nomeProduto}" de €${valorFinal} criada para cliente ${venda.cliente?.nome || clienteId}`,
      }
    });
    return NextResponse.json(venda, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao registrar venda.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, clienteId, nomeProduto, valorRevista, valorFinal, valorPago, observacoes, data, status } = body;
    if (!id || !clienteId || !nomeProduto || !valorRevista || !valorFinal || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: id, clienteId, nomeProduto, valorRevista, valorFinal, data.' }, { status: 400 });
    }
    
    // Calcular status automaticamente baseado no valor pago
    const valorPagoNum = Number(valorPago || 0);
    const valorFinalNum = Number(valorFinal);
    const statusAutomatico = valorPagoNum >= valorFinalNum ? 'PAGO' : 'PENDENTE';
    
    const vendaAtualizada = await prisma.venda.update({
      where: { id: Number(id) },
      data: {
        clienteId: Number(clienteId),
        nomeProduto,
        valorRevista: Number(valorRevista),
        valorFinal: valorFinalNum,
        valorPago: valorPagoNum,
        observacoes: observacoes || null,
        data: new Date(data),
        status: statusAutomatico,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
    });

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: 'EDITAR_VENDA',
        detalhes: `Venda "${nomeProduto}" (ID: ${id}) editada para €${valorFinal}`,
      }
    });
    return NextResponse.json(vendaAtualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar venda.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID da venda é obrigatório.' }, { status: 400 });
    }

    // Buscar dados da venda antes de deletar para o log
    const venda = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: { cliente: true },
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    await prisma.venda.delete({ where: { id: Number(id) } });

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: 'REMOVER_VENDA',
        detalhes: `Venda "${venda.nomeProduto}" (ID: ${id}) de €${venda.valorFinal} removida`,
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao remover venda.' }, { status: 500 });
  }
} 