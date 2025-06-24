import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const despesas = await prisma.despesa.findMany({ orderBy: { data: 'desc' } });
    return NextResponse.json(despesas);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar despesas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, valor, data } = body;
    if (!nome || !valor || !data) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }
    const despesa = await prisma.despesa.create({
      data: {
        nome,
        valor: parseFloat(valor),
        data: new Date(data),
      },
    });
    return NextResponse.json(despesa);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao adicionar despesa.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nome, valor, data } = body;
    if (!id || !nome || !valor || !data) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }
    const despesa = await prisma.despesa.update({
      where: { id: Number(id) },
      data: {
        nome,
        valor: parseFloat(valor),
        data: new Date(data),
      },
    });
    return NextResponse.json(despesa);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao editar despesa.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID não informado.' }, { status: 400 });
    }
    await prisma.despesa.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao eliminar despesa.' }, { status: 500 });
  }
} 