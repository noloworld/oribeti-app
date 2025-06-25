import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('online') === '1') {
    // Retorna usuários online (lastOnline nos últimos 2 minutos)
    const doisMinAtras = new Date(Date.now() - 2 * 60 * 1000);
    const online = await prisma.user.findMany({
      where: { lastOnline: { gte: doisMinAtras } },
      select: { id: true, nome: true, email: true, tipo: true, lastOnline: true },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(online);
  }
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, email, senha, tipo } = body;
    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
    }
    // Verifica se email já existe
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 });
    }
    const hash = await bcrypt.hash(senha, 10);
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hash,
        tipo: tipo === 'ADMIN' ? 'ADMIN' : 'REVENDEDOR',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true,
      },
    });
    return NextResponse.json(novoUsuario, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover usuário.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, email, senha, tipo } = body;
    if (!id || !nome || !email) {
      return NextResponse.json({ error: 'ID, nome e email são obrigatórios.' }, { status: 400 });
    }
    // Verifica se email já existe em outro usuário
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe && existe.id !== id) {
      return NextResponse.json({ error: 'Email já cadastrado em outro usuário.' }, { status: 409 });
    }
    let data: any = { nome, email, tipo: tipo === 'ADMIN' ? 'ADMIN' : 'REVENDEDOR' };
    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }
    const usuarioAtualizado = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true,
      },
    });
    return NextResponse.json(usuarioAtualizado);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao editar usuário.' }, { status: 500 });
  }
} 