import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        morada: true,
        criadoEm: true,
      },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar clientes.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, email, telefone, morada } = body;
    if (!nome) {
      return NextResponse.json({ error: 'O nome do cliente é obrigatório.' }, { status: 400 });
    }
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        email: email || null,
        telefone: telefone || null,
        morada: morada || null,
      },
    });
    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, email, telefone, morada } = body;
    if (!id || !nome) {
      return NextResponse.json({ error: 'ID e nome são obrigatórios.' }, { status: 400 });
    }
    const clienteAtualizado = await prisma.cliente.update({
      where: { id: Number(id) },
      data: {
        nome,
        email: email || null,
        telefone: telefone || null,
        morada: morada || null,
      },
    });
    return NextResponse.json(clienteAtualizado);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao editar cliente.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }
    await prisma.cliente.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover cliente.' }, { status: 500 });
  }
} 