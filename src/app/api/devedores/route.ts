import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todos os clientes que já foram devedores (tiveram vendas em aberto ou pagaram parcelado)
    const clientesDevedores = await prisma.cliente.findMany({
      where: {
        vendas: {
          some: {
            OR: [
              { status: 'PENDENTE' }, // Vendas em aberto
              {
                AND: [
                  { status: 'PAGO' },
                  {
                    pagamentos: {
                      some: {} // Tem pelo menos um pagamento
                    }
                  }
                ]
              }
            ]
          }
        }
      },
      include: {
        vendas: {
          include: {
            produtos: true,
            pagamentos: {
              orderBy: { data: 'desc' }
            }
          },
          orderBy: { data: 'desc' }
        }
      },
      orderBy: { nome: 'asc' }
    });

    // Processar os dados para incluir informações calculadas
    const clientesProcessados = clientesDevedores.map(cliente => {
      const vendasProcessadas = cliente.vendas.map(venda => {
        const valorFinal = venda.produtos.reduce((sum, produto) => sum + produto.valorFinal, 0);
        const valorEmDivida = valorFinal - (venda.valorPago || 0);
        const numPagamentos = venda.pagamentos.length;
        const foiDevedor = venda.status === 'PENDENTE' || (venda.status === 'PAGO' && numPagamentos > 1);
        
        return {
          ...venda,
          valorFinal,
          valorEmDivida,
          numPagamentos,
          foiDevedor
        };
      });

      // Calcular estatísticas do cliente
      const totalVendas = vendasProcessadas.length;
      const vendasEmAberto = vendasProcessadas.filter(v => v.status === 'PENDENTE').length;
      const vendasPagasParcelado = vendasProcessadas.filter(v => v.status === 'PAGO' && v.numPagamentos > 1).length;
      const totalDevido = vendasProcessadas.reduce((sum, v) => sum + v.valorEmDivida, 0);
      const valorMaxDevido = Math.max(...vendasProcessadas.map(v => v.valorFinal), 0);
      const ultimaVenda = vendasProcessadas[0];
      const ultimoPagamento = ultimaVenda?.pagamentos[0];

      return {
        ...cliente,
        vendas: vendasProcessadas,
        estatisticas: {
          totalVendas,
          vendasEmAberto,
          vendasPagasParcelado,
          totalDevido,
          valorMaxDevido,
          ultimaVenda: ultimaVenda ? new Date(ultimaVenda.data).toLocaleDateString() : null,
          ultimoPagamento: ultimoPagamento ? new Date(ultimoPagamento.data).toLocaleDateString() : null
        }
      };
    });

    return NextResponse.json({ clientes: clientesProcessados });
  } catch (error) {
    console.error('Erro ao buscar devedores:', error);
    return NextResponse.json({ error: 'Erro ao buscar devedores.' }, { status: 500 });
  }
} 