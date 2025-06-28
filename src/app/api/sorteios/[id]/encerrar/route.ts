import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/sorteios/[id]/encerrar - Insere número vencedor e encerra sorteio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sorteioId = Number(params.id);
    const { numeroVencedor } = await req.json();
    if (!sorteioId || !numeroVencedor) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }
    // Busca participação vencedora
    const participacao = await prisma.participacaoSorteio.findFirst({
      where: { sorteioId, numero: numeroVencedor },
      include: { cliente: true },
    });
    let vencedorId = null;
    if (participacao) {
      vencedorId = participacao.clienteId;
    }
    // Atualiza sorteio
    const sorteio = await prisma.sorteio.update({
      where: { id: sorteioId },
      data: {
        numeroVencedor,
        vencedorId,
        encerrado: true,
      },
      include: { participacoes: true },
    });
    let mensagem;
    if (participacao) {
      mensagem = `🎉 Cliente ${participacao.cliente.nome} foi o(a) vencedor(a) do ${sorteio.nome}, parabéns!`;
    } else {
      mensagem = 'Nenhum cliente escolheu esse número.';
    }
    return NextResponse.json({ sorteio, mensagem });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao encerrar sorteio' }, { status: 500 });
  }
} 