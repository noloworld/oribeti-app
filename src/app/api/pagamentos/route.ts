import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserFromToken } from '@/lib/auth';

// Buscar pagamentos de uma venda específica
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendaId = searchParams.get('vendaId');
    
    if (!vendaId) {
      return NextResponse.json({ error: 'vendaId é obrigatório.' }, { status: 400 });
    }

    const pagamentos = await prisma.pagamento.findMany({
      where: { vendaId: Number(vendaId) },
      orderBy: { data: 'desc' },
    });

    return NextResponse.json(pagamentos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos.' }, { status: 500 });
  }
}

// Criar novo pagamento
export async function POST(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { vendaId, valor, data, observacoes } = body;
    
    console.log('API Pagamentos - Recebido:', { vendaId, valor, data, observacoes });
    
    if (!vendaId || !valor || !data) {
      console.log('API Pagamentos - Campos obrigatórios faltando');
      return NextResponse.json({ error: 'vendaId, valor e data são obrigatórios.' }, { status: 400 });
    }

    console.log('API Pagamentos - Criando pagamento...');
    // Criar o pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        vendaId: Number(vendaId),
        valor: Number(valor),
        data: new Date(data),
        observacoes: observacoes || null,
      },
    });

    console.log('API Pagamentos - Pagamento criado:', pagamento);

    // Atualizar valorPago na venda
    const pagamentos = await prisma.pagamento.findMany({
      where: { vendaId: Number(vendaId) },
    });
    
    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    console.log('API Pagamentos - Total pago:', totalPago);
    
    // Buscar a venda para obter o valorFinal
    const venda = await prisma.venda.findUnique({
      where: { id: Number(vendaId) },
      include: { 
        cliente: true,
        produtos: true 
      },
    });

    if (!venda) {
      console.log('API Pagamentos - Venda não encontrada');
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    // Calcular valorFinal baseado nos produtos
    const valorFinal = venda.produtos.reduce((acc, p) => acc + (p.valorFinal * (p.quantidade || 1)), 0);

    // Atualizar valorPago e status na venda
    const statusAutomatico = totalPago >= valorFinal ? 'PAGO' : 'PENDENTE';
    console.log('API Pagamentos - Status automático:', statusAutomatico);
    
    await prisma.venda.update({
      where: { id: Number(vendaId) },
      data: {
        valorPago: totalPago,
        status: statusAutomatico,
      },
    });

    // Gravar log da ação
    const nomeProduto = venda.produtos[0]?.nomeProduto || 'Produto';
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'CRIAR_PAGAMENTO',
        detalhes: `Pagamento de €${valor} registado para venda "${nomeProduto}" (Cliente: ${venda.cliente.nome})`,
      },
    });

    console.log('API Pagamentos - Venda atualizada com sucesso');
    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error('API Pagamentos - Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento.' }, { status: 500 });
  }
}

// Deletar pagamento
export async function DELETE(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, vendaId } = body;
    
    if (!id || !vendaId) {
      return NextResponse.json({ error: 'id e vendaId são obrigatórios.' }, { status: 400 });
    }

    // Buscar dados do pagamento antes de deletar para o log
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: Number(id) },
      include: {
        venda: {
          include: { 
            cliente: true,
            produtos: true 
          }
        }
      }
    });

    // Deletar o pagamento
    await prisma.pagamento.delete({
      where: { id: Number(id) },
    });

    // Recalcular valorPago na venda
    const pagamentos = await prisma.pagamento.findMany({
      where: { vendaId: Number(vendaId) },
    });
    
    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    
    // Buscar a venda para obter o valorFinal
    const venda = await prisma.venda.findUnique({
      where: { id: Number(vendaId) },
      include: { produtos: true },
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    // Calcular valorFinal baseado nos produtos
    const valorFinal = venda.produtos.reduce((acc, p) => acc + (p.valorFinal * (p.quantidade || 1)), 0);

    // Atualizar valorPago e status na venda
    const statusAutomatico = totalPago >= valorFinal ? 'PAGO' : 'PENDENTE';
    
    await prisma.venda.update({
      where: { id: Number(vendaId) },
      data: {
        valorPago: totalPago,
        status: statusAutomatico,
      },
    });

    // Gravar log da ação
    if (pagamento) {
      const nomeProduto = pagamento.venda.produtos[0]?.nomeProduto || 'Produto';
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email || '',
          acao: 'REMOVER_PAGAMENTO',
          detalhes: `Pagamento de €${pagamento.valor} removido da venda "${nomeProduto}" (Cliente: ${pagamento.venda.cliente.nome})`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao deletar pagamento.' }, { status: 500 });
  }
} 