import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
    }
    const senhaOk = await bcrypt.compare(senha, user.senha);
    if (!senhaOk) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
    }
    
    // Atualizar lastOnline
    await prisma.user.update({
      where: { id: user.id },
      data: { lastOnline: new Date() }
    });
    
    const token = createToken({ 
      id: user.id, 
      email: user.email, 
      nome: user.nome, 
      tipo: user.tipo 
    });
    
    const res = NextResponse.json({ success: true });
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (error) {
    console.error('ERRO LOGIN:', error);
    return NextResponse.json({ error: 'Erro ao fazer login.' }, { status: 500 });
  }
} 