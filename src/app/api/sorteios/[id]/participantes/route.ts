import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sorteios/[id]/participantes - Lista participantes do sorteio
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sorteioId = Number(params.id);
    if (!sorteioId) {
      return NextResponse.json({ error: 'ID do sorteio inválido' }, { status: 400 });
    }
    const participantes = await prisma.participacaoSorteio.findMany({
      where: { sorteioId },
      include: { cliente: true },
      orderBy: { data: 'asc' },
    });
    return NextResponse.json(participantes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar participantes' }, { status: 500 });
  }
}

// DELETE /api/sorteios/[id]/participantes?idParticipacao=123
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url!);
    const idParticipacao = url.searchParams.get('idParticipacao');
    if (!idParticipacao) {
      return NextResponse.json({ error: 'ID da participação é obrigatório' }, { status: 400 });
    }
    await prisma.participacaoSorteio.delete({ where: { id: Number(idParticipacao) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover participação' }, { status: 500 });
  }
} 