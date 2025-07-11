import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Paginação
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [total, despesas] = await Promise.all([
      prisma.despesa.count(),
      prisma.despesa.findMany({
        orderBy: { data: 'desc' },
        skip,
        take: limit,
        include: {
          produtos: true
        }
      })
    ]);
    return NextResponse.json({ despesas, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro ao buscar despesas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { nome, valor, data, produtos } = body;
    if (!nome || !data) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }
    
    // Calcular valor total baseado nos produtos ou usar valor fornecido
    const valorTotal = produtos && produtos.length > 0 
      ? produtos.reduce((total: number, produto: any) => total + (produto.quantidade * produto.preco), 0)
      : parseFloat(valor || '0');
    
    const despesa = await prisma.despesa.create({
      data: {
        nome,
        valor: valorTotal,
        data: new Date(data),
        produtos: produtos && produtos.length > 0 ? {
          create: produtos.map((produto: any) => ({
            nome: produto.nome,
            quantidade: parseInt(produto.quantidade),
            preco: parseFloat(produto.preco)
          }))
        } : undefined
      },
      include: {
        produtos: true
      }
    });

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'CRIAR_DESPESA',
        detalhes: `Despesa "${despesa.nome}" de €${despesa.valor} criada`,
      },
    });

    return NextResponse.json(despesa);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro ao adicionar despesa.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, nome, valor, data, produtos } = body;
    if (!id || !nome || !data) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }
    
    // Calcular valor total baseado nos produtos ou usar valor fornecido
    const valorTotal = produtos && produtos.length > 0 
      ? produtos.reduce((total: number, produto: any) => total + (produto.quantidade * produto.preco), 0)
      : parseFloat(valor || '0');
    
    // Primeiro, deletar produtos existentes
    await prisma.produtoDespesa.deleteMany({
      where: { despesaId: Number(id) }
    });
    
    const despesa = await prisma.despesa.update({
      where: { id: Number(id) },
      data: {
        nome,
        valor: valorTotal,
        data: new Date(data),
        produtos: produtos && produtos.length > 0 ? {
          create: produtos.map((produto: any) => ({
            nome: produto.nome,
            quantidade: parseInt(produto.quantidade),
            preco: parseFloat(produto.preco)
          }))
        } : undefined
      },
      include: {
        produtos: true
      }
    });

    // Gravar log da ação
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || '',
        acao: 'EDITAR_DESPESA',
        detalhes: `Despesa "${despesa.nome}" (ID: ${id}) editada para €${despesa.valor}`,
      },
    });

    return NextResponse.json(despesa);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro ao editar despesa.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID não informado.' }, { status: 400 });
    }

    // Buscar dados da despesa antes de deletar para o log
    const despesa = await prisma.despesa.findUnique({
      where: { id: Number(id) },
      select: { nome: true, valor: true },
    });

    await prisma.despesa.delete({ where: { id: Number(id) } });

    // Gravar log da ação
    if (despesa) {
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email || '',
          acao: 'REMOVER_DESPESA',
          detalhes: `Despesa "${despesa.nome}" (ID: ${id}) de €${despesa.valor} removida`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro ao eliminar despesa.' }, { status: 500 });
  }
} 