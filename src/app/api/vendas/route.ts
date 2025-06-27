import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserFromToken } from '@/lib/auth';

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
          produtos: true,
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
          produtos: true,
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
    return NextResponse.json({ vendas: [], total: 0, error: 'Erro ao buscar vendas.' }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { clienteId, produtos, observacoes, data, status, valorPago } = body;
    if (!clienteId || !produtos || !Array.isArray(produtos) || produtos.length === 0 || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: clienteId, produtos (array), data.' }, { status: 400 });
    }
    // Validação dos produtos
    for (const p of produtos) {
      if (!p.nomeProduto || !p.quantidade || !p.valorRevista || !p.valorFinal) {
        return NextResponse.json({ error: 'Cada produto precisa de nomeProduto, quantidade, valorRevista e valorFinal.' }, { status: 400 });
      }
    }
    // Calcular totais
    const totalRevista = produtos.reduce((acc, p) => acc + Number(p.valorRevista) * Number(p.quantidade), 0);
    const totalFinal = produtos.reduce((acc, p) => acc + Number(p.valorFinal) * Number(p.quantidade), 0);
    const valorPagoNum = Number(valorPago || 0);
    const statusAutomatico = valorPagoNum >= totalFinal ? 'PAGO' : 'PENDENTE';
    // Criar venda
    const venda = await prisma.venda.create({
      data: {
        clienteId: Number(clienteId),
        valorPago: valorPagoNum,
        observacoes: observacoes || null,
        data: new Date(data),
        status: statusAutomatico,
      },
    });
    // Criar produtos associados
    for (const p of produtos) {
      await prisma.vendaProduto.create({
        data: {
          vendaId: venda.id,
          nomeProduto: p.nomeProduto,
          quantidade: Number(p.quantidade),
          valorRevista: Number(p.valorRevista),
          valorFinal: Number(p.valorFinal),
        },
      });
    }
    // Criar primeiro pagamento se valorPago > 0
    if (valorPagoNum > 0) {
      await prisma.pagamento.create({
        data: {
          vendaId: venda.id,
          valor: valorPagoNum,
          data: new Date(data),
          observacoes: 'Primeira prestação',
        },
      });
    }
    // Buscar venda completa para retornar
    const vendaCompleta = await prisma.venda.findUnique({
      where: { id: venda.id },
      include: {
        cliente: { select: { id: true, nome: true } },
        produtos: true,
        pagamentos: true,
      },
    });
    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'CRIAR_VENDA',
        detalhes: `Venda criada para cliente ${vendaCompleta?.cliente?.nome || clienteId} com ${produtos.length} produto(s)`,
      }
    });
    return NextResponse.json(vendaCompleta, { status: 201 });
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
    const { id, clienteId, valorPago, observacoes, data, status } = body;
    if (!id || !clienteId || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: id, clienteId, data.' }, { status: 400 });
    }
    
    // Buscar a venda atual para obter o valorFinal
    const vendaAtual = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: { produtos: true }
    });
    
    if (!vendaAtual) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }
    
    // Calcular valorFinal baseado nos produtos
    const valorFinal = vendaAtual.produtos.reduce((acc, p) => acc + p.valorFinal, 0);
    
    // Calcular status automaticamente baseado no valor pago
    const valorPagoNum = Number(valorPago || 0);
    const statusAutomatico = valorPagoNum >= valorFinal ? 'PAGO' : 'PENDENTE';
    
    const vendaAtualizada = await prisma.venda.update({
      where: { id: Number(id) },
      data: {
        clienteId: Number(clienteId),
        valorPago: valorPagoNum,
        observacoes: observacoes || null,
        data: new Date(data),
        status: statusAutomatico,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        produtos: true,
      },
    });

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'EDITAR_VENDA',
        detalhes: `Venda (ID: ${id}) editada para €${valorFinal}`,
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
      include: { cliente: true, produtos: true },
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    await prisma.venda.delete({ where: { id: Number(id) } });

    // Gravar log da ação
    const valorTotal = venda.produtos.reduce((acc, p) => acc + p.valorFinal, 0);
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'REMOVER_VENDA',
        detalhes: `Venda (ID: ${id}) de €${valorTotal} removida`,
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao remover venda.' }, { status: 500 });
  }
} 