import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/auth-token=([^;]+)/);
    if (!match) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    const token = match[1];
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }
    // Atualiza o campo lastOnline para agora
    await prisma.user.update({
      where: { id: payload.id },
      data: { lastOnline: new Date() },
    });
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, nome: true, email: true, tipo: true },
    });
    if (!user) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar utilizador logado.' }, { status: 500 });
  }
} 