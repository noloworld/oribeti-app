import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Total de clientes
    const totalClientes = await prisma.cliente.count();

    // Total de vendas
    const totalVendas = await prisma.venda.count();

    // Total ganho (somente vendas pagas)
    const vendasPagas = await prisma.venda.findMany({ 
      where: { status: 'PAGO' },
      include: { produtos: true }
    });
    const totalGanho = vendasPagas.reduce((acc, v) => {
      const valorVenda = v.produtos.reduce((sum, p) => sum + (p.valorFinal * (p.quantidade || 1)), 0);
      return acc + valorVenda;
    }, 0);

    // Clientes devedores (clientes com vendas pendentes)
    const vendasPendentes = await prisma.venda.findMany({ 
      where: { status: 'PENDENTE' }, 
      include: { 
        cliente: true,
        produtos: true,
        pagamentos: true
      } 
    });
    // Agrupar por cliente, mas listar cada venda separada
    const clientesDevedoresMap = new Map();
    vendasPendentes.forEach(v => {
      if (!clientesDevedoresMap.has(v.clienteId)) {
        clientesDevedoresMap.set(v.clienteId, {
          id: v.clienteId,
          nome: v.cliente?.nome,
          vendas: [],
        });
      }
      const valorVenda = v.produtos.reduce((sum, p) => sum + (p.valorFinal * (p.quantidade || 1)), 0);
      const valorPago = v.pagamentos.reduce((sum, p) => sum + p.valor, 0);
      const valorDivida = valorVenda - valorPago;
      if (valorDivida > 0) {
        clientesDevedoresMap.get(v.clienteId).vendas.push({
          vendaId: v.id,
          data: v.data,
          valorTotal: valorVenda,
          valorPago,
          valorEmDivida: valorDivida,
          pagamentos: v.pagamentos,
        });
      }
    });
    const clientesDevedores = Array.from(clientesDevedoresMap.values()).filter(c => c.vendas.length > 0);

    // Vendas por mês (do ano atual)
    const anoAtual = new Date().getFullYear();
    const vendasAno = await prisma.venda.findMany({
      where: { data: { gte: new Date(`${anoAtual}-01-01`), lte: new Date(`${anoAtual}-12-31`) } },
      include: { produtos: true },
    });
    const vendasPorMes: { mes: number; total: number }[] = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
    vendasAno.forEach(v => {
      const mes = new Date(v.data).getMonth();
      const valorVenda = v.produtos.reduce((sum, p) => sum + (p.valorFinal * (p.quantidade || 1)), 0);
      vendasPorMes[mes].total += valorVenda;
    });

    // Vendas por ano (últimos 5 anos)
    const vendasAll = await prisma.venda.findMany({
      include: { produtos: true }
    });
    const vendasPorAnoMap = new Map<number, number>();
    vendasAll.forEach(v => {
      const ano = new Date(v.data).getFullYear();
      const valorVenda = v.produtos.reduce((sum, p) => sum + (p.valorFinal * (p.quantidade || 1)), 0);
      vendasPorAnoMap.set(ano, (vendasPorAnoMap.get(ano) || 0) + valorVenda);
    });
    const vendasPorAno = Array.from(vendasPorAnoMap.entries()).map(([ano, total]) => ({ ano, total })).sort((a, b) => b.ano - a.ano).slice(0, 5);

    // Top 5 clientes (quem mais gastou)
    const vendasComCliente = await prisma.venda.findMany({
      where: { status: 'PAGO' },
      include: { 
        cliente: true,
        produtos: true 
      },
    });
    const gastoPorCliente = new Map<number, { id: number; nome: string; totalGasto: number }>();
    vendasComCliente.forEach(v => {
      if (!v.cliente) return;
      if (!gastoPorCliente.has(v.clienteId)) {
        gastoPorCliente.set(v.clienteId, { id: v.clienteId, nome: v.cliente.nome, totalGasto: 0 });
      }
      const valorVenda = v.produtos.reduce((sum, p) => sum + (p.valorFinal * (p.quantidade || 1)), 0);
      gastoPorCliente.get(v.clienteId)!.totalGasto += valorVenda;
    });
    const top5Clientes = Array.from(gastoPorCliente.values()).sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 5);

    // Últimos clientes adicionados (5 mais recentes)
    const ultimosClientes = await prisma.cliente.findMany({ orderBy: { criadoEm: 'desc' }, take: 5 });

    return NextResponse.json({
      totalClientes,
      totalVendas,
      totalGanho,
      clientesDevedores,
      vendasPorMes,
      vendasPorAno,
      top5Clientes,
      ultimosClientes,
    });
  } catch (error) {
    return NextResponse.json({
      totalClientes: 0,
      totalVendas: 0,
      totalGanho: 0,
      clientesDevedores: [],
      vendasPorMes: [],
      vendasPorAno: [],
      top5Clientes: [],
      ultimosClientes: [],
      error: 'Erro ao buscar resumo do dashboard.'
    }, { status: 200 });
  }
} 