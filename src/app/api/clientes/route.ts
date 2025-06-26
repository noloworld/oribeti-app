import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractUserFromToken } from '@/lib/auth';

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
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar clientes.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

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

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'CRIAR_CLIENTE',
        detalhes: `Cliente "${novoCliente.nome}" criado`,
      },
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

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

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'EDITAR_CLIENTE',
        detalhes: `Cliente "${clienteAtualizado.nome}" editado`,
      },
    });

    return NextResponse.json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar cliente.' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    // Buscar dados do cliente antes de deletar para o log
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(id) },
      select: { nome: true },
    });

    await prisma.cliente.delete({ where: { id: Number(id) } });

    // Gravar log da ação
    if (cliente) {
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email || '',
          acao: 'REMOVER_CLIENTE',
          detalhes: `Cliente "${cliente.nome}" (ID: ${id}) removido`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao remover cliente.' }, { status: 500 });
  }
} 