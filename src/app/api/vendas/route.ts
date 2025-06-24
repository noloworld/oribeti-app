import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
    return NextResponse.json(vendas);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vendas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteId, nomeProduto, valorRevista, valorFinal, data, status } = body;
    if (!clienteId || !nomeProduto || !valorRevista || !valorFinal || !data || !status) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    const venda = await prisma.venda.create({
      data: {
        clienteId: Number(clienteId),
        nomeProduto,
        valorRevista: Number(valorRevista),
        valorFinal: Number(valorFinal),
        data: new Date(data),
        status,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(venda, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar venda.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, clienteId, nomeProduto, valorRevista, valorFinal, data, status } = body;
    if (!id || !clienteId || !nomeProduto || !valorRevista || !valorFinal || !data || !status) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    const vendaAtualizada = await prisma.venda.update({
      where: { id: Number(id) },
      data: {
        clienteId: Number(clienteId),
        nomeProduto,
        valorRevista: Number(valorRevista),
        valorFinal: Number(valorFinal),
        data: new Date(data),
        status,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(vendaAtualizada);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao editar venda.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID da venda é obrigatório.' }, { status: 400 });
    }
    await prisma.venda.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover venda.' }, { status: 500 });
  }
} 