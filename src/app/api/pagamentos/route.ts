import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    return NextResponse.json({ error: 'Erro ao buscar pagamentos.' }, { status: 500 });
  }
}

// Criar novo pagamento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendaId, valor, data, observacoes } = body;
    
    if (!vendaId || !valor || !data) {
      return NextResponse.json({ error: 'vendaId, valor e data são obrigatórios.' }, { status: 400 });
    }

    // Criar o pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        vendaId: Number(vendaId),
        valor: Number(valor),
        data: new Date(data),
        observacoes: observacoes || null,
      },
    });

    // Atualizar valorPago na venda
    const pagamentos = await prisma.pagamento.findMany({
      where: { vendaId: Number(vendaId) },
    });
    
    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
    
    // Buscar a venda para obter o valorFinal
    const venda = await prisma.venda.findUnique({
      where: { id: Number(vendaId) },
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    // Atualizar valorPago e status na venda
    const statusAutomatico = totalPago >= venda.valorFinal ? 'PAGO' : 'PENDENTE';
    
    await prisma.venda.update({
      where: { id: Number(vendaId) },
      data: {
        valorPago: totalPago,
        status: statusAutomatico,
      },
    });

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar pagamento.' }, { status: 500 });
  }
}

// Deletar pagamento
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, vendaId } = body;
    
    if (!id || !vendaId) {
      return NextResponse.json({ error: 'id e vendaId são obrigatórios.' }, { status: 400 });
    }

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
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
    }

    // Atualizar valorPago e status na venda
    const statusAutomatico = totalPago >= venda.valorFinal ? 'PAGO' : 'PENDENTE';
    
    await prisma.venda.update({
      where: { id: Number(vendaId) },
      data: {
        valorPago: totalPago,
        status: statusAutomatico,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar pagamento.' }, { status: 500 });
  }
} 