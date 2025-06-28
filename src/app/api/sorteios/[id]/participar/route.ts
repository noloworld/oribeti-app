import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/sorteios/[id]/participar - Adiciona participação
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sorteioId = Number(params.id);
    const { clienteId, numero } = await req.json();
    if (!sorteioId || !clienteId || !numero) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }
    // Permitir múltiplas participações do mesmo cliente, mas não com o mesmo número
    const existe = await prisma.participacaoSorteio.findFirst({
      where: { sorteioId, numero },
    });
    if (existe) {
      return NextResponse.json({ error: 'Número já escolhido neste sorteio' }, { status: 400 });
    }
    const participacao = await prisma.participacaoSorteio.create({
      data: { sorteioId, clienteId, numero },
    });
    return NextResponse.json(participacao, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao adicionar participação' }, { status: 500 });
  }
} 