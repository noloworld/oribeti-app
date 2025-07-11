"use client";

import React, { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { Transition } from '@headlessui/react';
import ListaPagamentos from '../../../components/ListaPagamentos';
import { useModalAberto } from '../../../components/ModalContext';
import PagamentoModal from '../../../components/PagamentoModal';

interface Cliente {
  id: number;
  nome: string;
}

interface ProdutoVenda {
  id: number;
  nomeProduto: string;
  quantidade: number;
  valorRevista: number;
  valorFinal: number;
}

interface Venda {
  id: number;
  cliente: { id: number; nome: string };
  produtos: ProdutoVenda[];
  valorPago: number;
  observacoes?: string;
  data: string;
  status: string;
}

export default function VendasPage() {
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [form, setForm] = useState<{
    clienteId: string;
    nomeProduto: string;
    quantidade: number;
    valorRevista: number;
    valorFinal: number;
    valorPago: number;
    observacoes: string;
    data: string;
    status: string;
  }>({
    clienteId: '',
    nomeProduto: '',
    quantidade: 1,
    valorRevista: 0,
    valorFinal: 0,
    valorPago: 0,
    observacoes: '',
    data: '',
    status: 'PENDENTE',
  });
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVenda, setEditVenda] = useState<Venda | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<Venda | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<'TODOS' | 'PAGO' | 'PENDENTE'>('TODOS');
  const [anoFiltro, setAnoFiltro] = useState<string>('TODOS');
  const anosDisponiveis = Array.from(new Set(vendas.map(v => new Date(v.data).getFullYear())));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const [isPrestacoes, setIsPrestacoes] = useState(false);
  const [isEditPrestacoes, setIsEditPrestacoes] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const { setModalAberto } = useModalAberto();
  // Estado para paginação mobile
  const [mobilePage, setMobilePage] = useState(1);
  const cardsPorPagina = 3;
  const vendasEmDiaMobile = vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)) <= 0 && 
    (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) &&
    (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)
  );
  const totalPaginasMobile = Math.ceil(vendasEmDiaMobile.length / cardsPorPagina);
  const vendasPaginaMobile = vendasEmDiaMobile.slice((mobilePage - 1) * cardsPorPagina, mobilePage * cardsPorPagina);
  // Adicionar estados para paginação dos devedores
  const [todasVendas, setTodasVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState([
    { nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }
  ]);
  // Estados para modais de ações
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [touched, setTouched] = useState(false);
  const [clienteExpandido, setClienteExpandido] = useState<number | null>(null);
  const [abaterClienteId, setAbaterClienteId] = useState<number | null>(null);
  const [valorAbater, setValorAbater] = useState<string>('');
  const [abaterLoading, setAbaterLoading] = useState(false);
  const [abaterErro, setAbaterErro] = useState<string>('');
  // Novo estado para expandir cliente em dia
  const [clienteEmDiaExpandido, setClienteEmDiaExpandido] = useState<number | null>(null);
  // Estado para paginação das vendas
  const [paginaAtualVendas, setPaginaAtualVendas] = useState<Record<number, number>>({});
  // Adicionar estado para nome do cliente no modal
  const [clienteModalNome, setClienteModalNome] = useState<string | null>(null);

  // Função para paginação das vendas
  const getVendasPaginadas = (vendas: any[], clienteId: number) => {
    const vendasPorPagina = 7;
    const paginaAtual = paginaAtualVendas[clienteId] || 1;
    const inicio = (paginaAtual - 1) * vendasPorPagina;
    const fim = inicio + vendasPorPagina;
    const vendasPaginadas = vendas.slice(inicio, fim);
    const totalPaginas = Math.ceil(vendas.length / vendasPorPagina);
    
    return {
      vendas: vendasPaginadas,
      paginaAtual,
      totalPaginas,
      temMaisVendas: vendas.length > vendasPorPagina
    };
  };

  // Função para mudar página
  const mudarPagina = (clienteId: number, novaPagina: number) => {
    setPaginaAtualVendas(prev => ({
      ...prev,
      [clienteId]: novaPagina
    }));
  };

  // Buscar clientes ao abrir o modal
  useEffect(() => {
    if (showModal) {
      fetch("/api/clientes")
        .then((res) => res.json())
        .then((data) => setClientes(data || []));
    }
  }, [showModal]);

  // Buscar vendas ao carregar a página ou após nova venda
  const fetchVendas = () => {
    fetch(`/api/vendas?page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setVendas(data.vendas || []);
        setTotal(data.total || 0);
      });
  };
  useEffect(() => {
    fetchVendas();
    // eslint-disable-next-line
  }, [page, limit]);

  // Buscar todas as vendas ao carregar a página (ou sempre que necessário)
  useEffect(() => {
    fetch('/api/vendas?all=true')
      .then(res => res.json())
      .then(data => setTodasVendas(data.vendas || []));
  }, []);

  // Após buscar todasVendas, agrupar devedores por cliente:
  const clientesDevedores = Object.values(
    todasVendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)) > 0)
      .reduce((acc, venda) => {
        const valorTotal = venda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0);
        const valorEmDivida = valorTotal - (venda.valorPago || 0);
        if (!acc[venda.cliente.id]) {
          acc[venda.cliente.id] = {
            id: venda.cliente.id,
            nome: venda.cliente.nome,
            totalEmDivida: 0,
            vendas: []
          };
        }
        acc[venda.cliente.id].totalEmDivida += valorEmDivida;
        acc[venda.cliente.id].vendas.push({ ...venda, valorEmDivida });
        return acc;
      }, {} as Record<string, { id: number, nome: string, totalEmDivida: number, vendas: any[] }>));

  // Agrupar vendas pagas por cliente
  const clientesEmDiaAgrupados = Object.values(
    vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)) <= 0)
      .reduce((acc, venda) => {
        const valorTotal = venda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0);
        if (!acc[venda.cliente.id]) {
          acc[venda.cliente.id] = {
            id: venda.cliente.id,
            nome: venda.cliente.nome,
            totalPago: 0,
            vendas: []
          };
        }
        acc[venda.cliente.id].totalPago += venda.valorPago || 0;
        acc[venda.cliente.id].vendas.push({ ...venda, valorTotal });
        return acc;
      }, {} as Record<string, { id: number, nome: string, totalPago: number, vendas: any[] }>));

  // Manipulação do formulário
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ADICIONAR CÁLCULO AUTOMÁTICO DO VALOR EM DÍVIDA
  const valorEmDivida = Number(form.valorFinal) - Number(form.valorPago || 0);

  // Função para adicionar produto
  function handleAddProduto() {
    setProdutos([...produtos, { nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
  }
  // Função para remover produto
  function handleRemoveProduto(idx: number) {
    setProdutos(produtos.filter((_, i) => i !== idx));
  }
  // Função para alterar produto
  function handleProdutoChange(idx: number, field: string, value: any) {
    setProdutos(produtos.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  // Função para alterar produto na edição
  function handleEditProdutoChange(idx: number, field: string, value: any) {
    if (editVenda) {
      setEditVenda({
        ...editVenda,
        produtos: editVenda.produtos.map((p, i) => i === idx ? { ...p, [field]: value } : p)
      });
    }
  }

  // Calcular total
  const totalRevista = produtos.reduce((acc, p) => acc + Number(p.valorRevista || 0) * Number(p.quantidade || 1), 0);
  const totalFinal = produtos.reduce((acc, p) => acc + Number(p.valorFinal || 0) * Number(p.quantidade || 1), 0);

  // Função para checar se todos os campos obrigatórios estão preenchidos
  const isFormValid = () => {
    if (!form.clienteId || !form.data) return false;
    for (const p of produtos) {
      if (!p.nomeProduto || !p.quantidade || !p.valorRevista || !p.valorFinal) return false;
    }
    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    // Validação simples
    if (!isFormValid()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    // Verificar se o cliente já tem vendas (apenas quando não é um acréscimo direto)
    if (!clienteModalNome) { // clienteModalNome só é definido quando vem dos botões "Acrescentar venda"
      const clienteId = Number(form.clienteId);
      const clienteJaTemVendas = todasVendas.some(venda => venda.cliente.id === clienteId);
      
      if (clienteJaTemVendas) {
        const nomeCliente = clientes.find(c => c.id === clienteId)?.nome || 'Cliente';
        toast.error(`O cliente ${nomeCliente} já tem vendas registadas. Para adicionar uma nova venda a este cliente, use o botão "Acrescentar venda" na tabela de clientes.`, {
          duration: 6000,
        });
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      // Calcular valor pago corretamente
      const valorPago = isPrestacoes ? 0 : Number(form.valorPago || 0);
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: form.clienteId,
          produtos,
          observacoes: form.observacoes,
          data: form.data,
          valorPago, // Enviar valorPago correto
          status: 'PENDENTE',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao registrar venda.');
        setLoading(false);
        return;
      }
      toast.success('Venda registrada com sucesso!');
      setShowModal(false);
      setModalAberto(false);
      setForm({ clienteId: '', nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
      setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]); // Reset dos produtos
      setIsPrestacoes(false); // Reset do estado de prestações
      setTouched(false);
      fetchVendas();
      // Atualizar todasVendas também
      fetch('/api/vendas?all=true')
        .then(res => res.json())
        .then(data => setTodasVendas(data.vendas || []));
    } catch {
      toast.error('Erro ao registrar venda.');
    } finally {
      setLoading(false);
    }
  }

  function handlePrintVenda(venda: Venda) {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString();
    // Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 120);
    doc.text('Oribeti', 20, 18);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Fatura', 170, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data: ${dataAtual}`, 20, 26);
    doc.text(`Nº Fatura: ${venda.id}`, 20, 32);
    doc.text('IVA: 23%', 170, 26, { align: 'right' });
    // Cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Cliente:', 20, 42);
    doc.setFontSize(11);
    doc.text(`${venda.cliente?.nome || '-'}`, 35, 42);
    // Tabela de itens
    let y = 54;
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, 170, 10, 'F');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 120);
    doc.text('Qtd.', 24, y + 7);
    doc.text('Descrição', 40, y + 7);
    doc.text('Preço Unit.', 120, y + 7);
    doc.text('Total', 170, y + 7, { align: 'right' });
    // Linha do produto
    y += 12;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('1', 26, y + 6);
    doc.text(venda.produtos[0].nomeProduto, 40, y + 6);
    doc.text(`€${venda.produtos[0].valorFinal.toFixed(2)}`, 120, y + 6);
    doc.text(`€${venda.produtos[0].valorFinal.toFixed(2)}`, 170, y + 6, { align: 'right' });
    // Totais
    y += 18;
    const subtotal = venda.produtos[0].valorFinal / 1.23;
    const iva = venda.produtos[0].valorFinal - subtotal;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', 120, y);
    doc.text(`€${subtotal.toFixed(2)}`, 170, y, { align: 'right' });
    y += 8;
    doc.text('IVA (23%):', 120, y);
    doc.text(`€${iva.toFixed(2)}`, 170, y, { align: 'right' });
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(34, 197, 94);
    doc.text('Total:', 120, y);
    doc.text(`€${venda.produtos[0].valorFinal.toFixed(2)}`, 170, y, { align: 'right' });
    // Rodapé
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Obrigado pela sua compra!', 105, 285, { align: 'center' });
    doc.save(`fatura_${venda.cliente?.nome?.replace(/\s+/g, '_') || 'cliente'}_${dataAtual}.pdf`);
  }

  function toggleSelecionado(id: number) {
    setSelecionados((prev) => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  }
  function toggleSelecionarTodos(vendasFiltradas: Venda[]) {
    const todosIds = vendasFiltradas.map(v => v.id);
    if (todosIds.every(id => selecionados.includes(id))) {
      setSelecionados(prev => prev.filter(id => !todosIds.includes(id)));
    } else {
      setSelecionados(prev => [...new Set([...prev, ...todosIds])]);
    }
  }
  function handleImprimirSelecionados(vendasFiltradas: Venda[]) {
    vendasFiltradas.filter(v => selecionados.includes(v.id)).forEach(handlePrintVenda);
  }
  async function handleEliminarSelecionados(vendasFiltradas: Venda[]) {
    const vendasParaExcluir = vendasFiltradas.filter(v => selecionados.includes(v.id));
    for (const venda of vendasParaExcluir) {
      await fetch('/api/vendas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: venda.id }),
      });
    }
    setSelecionados([]);
    fetchVendas();
    toast.success('Vendas eliminadas!');
  }

  // Ao abrir modais
  function handleOpenModal() {
    setShowModal(true);
    setModalAberto(true);
    setForm({ clienteId: '', nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
    setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
    setIsPrestacoes(false);
    setTouched(false);
    setClienteModalNome(null);
  }
  function handleOpenEditModal(venda: Venda) {
    setEditVenda(venda);
    setShowEditModal(true);
    setModalAberto(true);
  }
  // Ao fechar modais
  function handleCloseModal() {
    setShowModal(false);
    setModalAberto(false);
    setEditVenda(null);
    setClienteModalNome(null);
    setForm({ clienteId: '', nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
    setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
    setIsPrestacoes(false);
    setTouched(false);
  }
  function handleCloseEditModal() {
    setShowEditModal(false);
    setEditVenda(null);
    setModalAberto(false);
  }

  // Sempre que mudar o filtro, resetar pageDevedores para 1
  useEffect(() => { setMobilePage(1); }, [statusFiltro, anoFiltro, vendas]);

  // Filtro e paginação dos devedores
  const devedoresFiltrados = todasVendas.filter(v => 
    (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)) > 0 &&
    (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) &&
    (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)
  );

  // Calcular totais das vendas para cards de resumo (usar todasVendas para ter valores completos)
  const totalVendas = todasVendas.reduce((acc, v) => acc + v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0), 0);
  
  // Calcular lucro apenas das vendas pagas (status PAGO ou valor pago >= valor total)
  const vendasPagas = todasVendas.filter(v => {
    const valorTotal = v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0);
    return v.status === 'PAGO' || (v.valorPago || 0) >= valorTotal;
  });
  const totalRevistaVendasPagas = vendasPagas.reduce((acc, v) => acc + v.produtos.reduce((pacc, p) => pacc + (p.valorRevista * p.quantidade), 0), 0);
  const totalFinalVendasPagas = vendasPagas.reduce((acc, v) => acc + v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0), 0);
  const lucro = totalFinalVendasPagas - totalRevistaVendasPagas;

  // Corrigir filtro de clientes em dia e devedores
  const clientesEmDia = vendas.filter(v => v.valorPago >= v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0));
  const devedores = vendas.filter(v => v.valorPago < v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0));

  // Handlers para abrir/fechar modais
  function handleVerVenda(venda: Venda) {
    setVendaSelecionada(venda);
    setShowVerModal(true);
  }
  function handleFecharVer() {
    setShowVerModal(false);
    setVendaSelecionada(null);
  }
  function handleAbrirPagamento(venda: Venda) {
    setVendaSelecionada(venda);
    setShowPagamentoModal(true);
  }
  function handleFecharPagamento() {
    setShowPagamentoModal(false);
    setVendaSelecionada(null);
  }

  // Função para abater valor na venda mais antiga em aberto do cliente
  async function handleAbaterDivida(cliente: any) {
    setAbaterErro('');
    const valor = parseFloat(valorAbater.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setAbaterErro('Digite um valor válido.');
      return;
    }
    if (valor > cliente.totalEmDivida) {
      setAbaterErro('O valor não pode ser maior que o total em dívida.');
      return;
    }
    setAbaterLoading(true);
    try {
      // Encontrar todas as vendas em aberto ordenadas da mais antiga para a mais recente
      const vendasEmAberto = cliente.vendas
        .filter((v: any) => v.valorEmDivida > 0)
        .slice()
        .reverse(); // Mais antiga primeiro
      
      if (vendasEmAberto.length === 0) {
        setAbaterErro('Nenhuma venda em aberto encontrada.');
        setAbaterLoading(false);
        return;
      }

      let valorRestante = valor;
      let pagamentosRealizados = 0;

      // Distribuir o valor entre as vendas em aberto, começando pela mais antiga
      for (const venda of vendasEmAberto) {
        if (valorRestante <= 0) break;

        const valorParaEstaVenda = Math.min(valorRestante, venda.valorEmDivida);
        
        // Criar pagamento para esta venda
        const res = await fetch('/api/pagamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendaId: venda.id,
            valor: valorParaEstaVenda,
            data: new Date().toISOString().split('T')[0],
            observacoes: `Abatimento direto pelo painel de devedores${vendasEmAberto.length > 1 ? ` (${pagamentosRealizados + 1}/${vendasEmAberto.length})` : ''}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setAbaterErro(data.error || 'Erro ao abater dívida.');
          setAbaterLoading(false);
          return;
        }

        valorRestante -= valorParaEstaVenda;
        pagamentosRealizados++;
      }

      setAbaterClienteId(null);
      setValorAbater('');
      setAbaterErro('');
      toast.success(`Dívida abatida com sucesso! ${pagamentosRealizados} pagamento(s) realizado(s).`);
      fetchVendas();
      // Atualizar todasVendas também
      fetch('/api/vendas?all=true')
        .then(res => res.json())
        .then(data => setTodasVendas(data.vendas || []));
    } catch (e) {
      setAbaterErro('Erro ao abater dívida.');
    } finally {
      setAbaterLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-600">Gerencie suas vendas e produtos</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total de Vendas */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <span className="text-sm font-medium text-gray-600">Total de Vendas</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-700 transition-all duration-300">{todasVendas.length}</span>
        </div>
        {/* Valor Total de Vendas */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <span className="text-sm font-medium text-gray-600">Valor Total</span>
          <span className="text-xl sm:text-2xl font-bold text-green-700 transition-all duration-300">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalVendas)}
          </span>
        </div>
        {/* Lucro */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <span className="text-sm font-medium text-gray-600">Lucro</span>
          <span className="text-xl sm:text-2xl font-bold text-yellow-600 transition-all duration-300">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(lucro)}
          </span>
        </div>
        {/* Número de Devedores */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <span className="text-sm font-medium text-gray-600">Devedores</span>
          <span className="text-xl sm:text-2xl font-bold text-red-600 transition-all duration-300">{clientesDevedores.length}</span>
        </div>
        {/* Valor Total Devedores */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <span className="text-sm font-medium text-gray-600">Valor Devedores</span>
          <span className="text-xl sm:text-2xl font-bold text-red-700 transition-all duration-300">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
              todasVendas
                .filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)) > 0)
                .reduce((acc, v) => acc + (v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)), 0)
            )}
          </span>
        </div>
      </div>

      {/* Botão Adicionar Venda */}
      <div className="mb-6 animate-fade-in-left" style={{animationDelay: '0.6s'}}>
        <button
          onClick={() => {
            setShowModal(true);
            setModalAberto(true);
            setForm({ clienteId: '', nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
            setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
            setIsPrestacoes(false);
            setTouched(false);
            setClienteModalNome(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
                          Adicionar venda
        </button>
      </div>

      {/* Tabelas de Vendas Clientes - DESKTOP */}
      <div className="mb-8 hidden sm:block animate-fade-in-up" style={{animationDelay: '0.8s'}}>
        <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2 transition-all duration-300">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse-soft"></span>
          Vendas Clientes
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden transform transition-all duration-500 hover:shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-white font-bold text-base">CLIENTE</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-white font-bold text-base">TOTAL PAGO</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-white font-bold text-base">EM DÍVIDA</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-white font-bold text-base">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Unificar clientes em dia e devedores */}
                {(() => {
                  type ClienteAgrupado = {
                    id: number;
                    nome: string;
                    vendas: any[];
                    totalPago: number;
                    totalEmDivida: number;
                  };
                  const clientesMap: Record<number, ClienteAgrupado> = {};
                  todasVendas.forEach((venda) => {
                    const id = venda.cliente.id;
                    if (!clientesMap[id]) {
                      clientesMap[id] = {
                        id,
                        nome: venda.cliente.nome,
                        vendas: [],
                        totalPago: 0,
                        totalEmDivida: 0,
                      };
                    }
                    const valorTotal = venda.produtos.reduce((a: number, p: any) => a + (p.valorFinal * p.quantidade), 0);
                    clientesMap[id].vendas.push({ ...venda, valorTotal, valorEmDivida: Math.max(0, valorTotal - (venda.valorPago || 0)) });
                    clientesMap[id].totalPago += venda.valorPago || 0;
                    clientesMap[id].totalEmDivida += Math.max(0, valorTotal - (venda.valorPago || 0));
                  });
                  const clientesArr: ClienteAgrupado[] = Object.values(clientesMap);
                  if (clientesArr.length === 0) {
                    return (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-4">Nenhum cliente com vendas</td></tr>
                    );
                  }
                  return clientesArr.map((cliente: ClienteAgrupado) => {
                    // Preparar dados de paginação para este cliente
                    const vendasOrdenadas = cliente.vendas
                      .slice()
                      .sort((a: any, b: any) => {
                        const aPendente = a.valorEmDivida > 0;
                        const bPendente = b.valorEmDivida > 0;
                        if (aPendente === bPendente) return new Date(b.data).getTime() - new Date(a.data).getTime();
                        return aPendente ? -1 : 1;
                      });
                    
                    const { vendas: vendasPaginadas, paginaAtual, totalPaginas, temMaisVendas } = getVendasPaginadas(vendasOrdenadas, cliente.id);
                    
                    return (
                    <React.Fragment key={cliente.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setClienteExpandido(clienteExpandido === cliente.id ? null : cliente.id)}>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-medium text-gray-900 flex items-center gap-2">
                          {cliente.nome}
                          {clienteExpandido === cliente.id ? (
                            <span className="ml-2">▼</span>
                          ) : (
                            <span className="ml-2">▶</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-green-700 font-bold">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cliente.totalPago)}</td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          {cliente.totalEmDivida > 0 && (
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-center">
                                <div className="text-sm font-medium">Em Dívida</div>
                                <div className="text-lg font-bold">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cliente.totalEmDivida)}</div>
                              </div>
                              <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-semibold transition-colors"
                                onClick={e => { e.stopPropagation(); setAbaterClienteId(cliente.id); setValorAbater(''); setAbaterErro(''); }}
                              >Abater</button>
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={e => { 
                              e.stopPropagation(); 
                              setShowModal(true); 
                              setModalAberto(true);
                              setForm({ clienteId: cliente.id.toString(), nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
                              setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
                              setIsPrestacoes(false);
                              setTouched(false);
                              setClienteModalNome(cliente.nome); 
                            }}
                          >Acrescentar venda</button>
                        </td>
                      </tr>
                      {/* Expandir vendas detalhadas */}
                      {clienteExpandido === cliente.id && (
                        <tr>
                          <td colSpan={4} className="bg-gray-50 p-0">
                            <div className="p-4 collapse-enter">
                              <div className="space-y-2 pagination-content">
                                {vendasPaginadas.map((venda: any) => (
                                      <div key={venda.id} className="flex items-center justify-between bg-white rounded shadow px-4 py-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`inline-block w-3 h-3 rounded-full ${venda.valorEmDivida > 0 ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                                          <span className="font-semibold">{new Date(venda.data).toLocaleDateString()}</span>
                                          <span className="text-gray-600">{(venda.produtos as any[]).map((p: any) => p.nomeProduto).join(', ')}</span>
                                          <span className="ml-2 font-bold text-blue-700">
                                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(venda.valorTotal)}
                                          </span>
                                          <span className="ml-2 text-sm text-gray-500">{venda.valorEmDivida > 0 ? 'Pendente' : 'Pago'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {venda.valorEmDivida === 0 && (
                                            <>
                                              <button title="Ver" onClick={e => { e.stopPropagation(); handleVerVenda(venda); }} className="text-blue-600 hover:text-blue-800 p-1 transform transition-all duration-200 hover:scale-110"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                              <button title="Imprimir" onClick={e => { e.stopPropagation(); handlePrintVenda(venda); }} className="text-green-600 hover:text-green-800 p-1 transform transition-all duration-200 hover:scale-110"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12v7H6z" /></svg></button>
                                            </>
                                          )}
                                          <button title="Eliminar" onClick={e => { e.stopPropagation(); setVendaToDelete(venda); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                      </div>
                                ))}
                                
                                {/* Paginação */}
                                {temMaisVendas && (
                                  <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                      onClick={() => mudarPagina(cliente.id, Math.max(1, paginaAtual - 1))}
                                      disabled={paginaAtual === 1}
                                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded pagination-btn"
                                    >
                                      ← Anterior
                                    </button>
                                    <span className="text-sm text-gray-600">
                                      Página {paginaAtual} de {totalPaginas}
                                    </span>
                                    <button
                                      onClick={() => mudarPagina(cliente.id, Math.min(totalPaginas, paginaAtual + 1))}
                                      disabled={paginaAtual === totalPaginas}
                                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded pagination-btn"
                                    >
                                      Seguinte →
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cards de Vendas Clientes - MOBILE */}
      <div className="mb-8 block sm:hidden animate-fade-in-up" style={{animationDelay: '0.8s'}}>
        <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2 transition-all duration-300">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse-soft"></span>
          Vendas Clientes
        </h2>
        <div className="space-y-4">
          {(() => {
            type ClienteAgrupado = {
              id: number;
              nome: string;
              vendas: any[];
              totalPago: number;
              totalEmDivida: number;
            };
            const clientesMap: Record<number, ClienteAgrupado> = {};
            todasVendas.forEach((venda) => {
              const id = venda.cliente.id;
              if (!clientesMap[id]) {
                clientesMap[id] = {
                  id,
                  nome: venda.cliente.nome,
                  vendas: [],
                  totalPago: 0,
                  totalEmDivida: 0,
                };
              }
              const valorTotal = venda.produtos.reduce((a: number, p: any) => a + (p.valorFinal * p.quantidade), 0);
              clientesMap[id].vendas.push({ ...venda, valorTotal, valorEmDivida: Math.max(0, valorTotal - (venda.valorPago || 0)) });
              clientesMap[id].totalPago += venda.valorPago || 0;
              clientesMap[id].totalEmDivida += Math.max(0, valorTotal - (venda.valorPago || 0));
            });
            const clientesArr: ClienteAgrupado[] = Object.values(clientesMap);
            if (clientesArr.length === 0) {
              return (
                <div className="text-center text-gray-400 py-4">Nenhum cliente com vendas</div>
              );
            }
            return clientesArr.map((cliente: ClienteAgrupado) => {
              // Preparar dados de paginação para este cliente (versão mobile)
              const vendasOrdenadas = cliente.vendas
                .slice()
                .sort((a: any, b: any) => {
                  const aPendente = a.valorEmDivida > 0;
                  const bPendente = b.valorEmDivida > 0;
                  if (aPendente === bPendente) return new Date(b.data).getTime() - new Date(a.data).getTime();
                  return aPendente ? -1 : 1;
                });
              
              const { vendas: vendasPaginadas, paginaAtual, totalPaginas, temMaisVendas } = getVendasPaginadas(vendasOrdenadas, cliente.id);
              
              return (
              <div key={cliente.id} className="bg-white rounded-lg shadow p-4 cursor-pointer select-none" onClick={() => setClienteExpandido(clienteExpandido === cliente.id ? null : cliente.id)}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900 text-lg flex-1">{cliente.nome}</div>
                  <span className="ml-2 text-gray-600">{clienteExpandido === cliente.id ? '▲' : '▼'}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="text-green-700 font-bold text-base">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cliente.totalPago)}</div>
                  {cliente.totalEmDivida > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-lg shadow-md text-center">
                        <div className="text-xs font-medium">Em Dívida</div>
                        <div className="text-sm font-bold">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cliente.totalEmDivida)}</div>
                      </div>
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                        onClick={e => { e.stopPropagation(); setAbaterClienteId(cliente.id); setValorAbater(''); setAbaterErro(''); }}
                      >Abater</button>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold text-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={e => { 
                      e.stopPropagation(); 
                      setShowModal(true); 
                      setModalAberto(true);
                      setForm({ clienteId: cliente.id.toString(), nomeProduto: '', quantidade: 1, valorRevista: 0, valorFinal: 0, valorPago: 0, observacoes: '', data: '', status: 'PENDENTE' });
                      setProdutos([{ nomeProduto: '', quantidade: 1, valorRevista: '', valorFinal: '' }]);
                      setIsPrestacoes(false);
                      setTouched(false);
                      setClienteModalNome(cliente.nome); 
                    }}
                  >Acrescentar venda</button>
                </div>
                {/* Expandir vendas detalhadas */}
                {clienteExpandido === cliente.id && (
                  <div className="mt-4 space-y-2 collapse-enter">
                    <div className="pagination-content">
                    {vendasPaginadas.map((venda: any) => (
                        <div key={venda.id} className="rounded border p-3 bg-gray-50">
                          <div className="flex items-start gap-3">
                            <span className={`inline-block w-3 h-3 rounded-full mt-1 flex-shrink-0 ${venda.valorEmDivida > 0 ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-medium text-sm mb-1">{(venda.produtos as any[]).map((p: any) => p.nomeProduto).join(', ')}</div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-blue-700 text-base">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(venda.valorTotal)}</span>
                                <span className={`text-xs font-semibold ${venda.valorEmDivida > 0 ? 'text-yellow-600' : 'text-green-700'}`}>{venda.valorEmDivida > 0 ? 'Pendente' : 'Pago'}</span>
                              </div>
                              <div className="flex justify-end gap-2">
                                {venda.valorEmDivida === 0 && (
                                  <>
                                    <button title="Ver" onClick={e => { e.stopPropagation(); handleVerVenda(venda); }} className="text-blue-600 hover:text-blue-800 p-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button title="Imprimir" onClick={e => { e.stopPropagation(); handlePrintVenda(venda); }} className="text-green-600 hover:text-green-800 p-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12v7H6z" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                                <button title="Eliminar" onClick={e => { e.stopPropagation(); setVendaToDelete(venda); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800 p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                    
                    {/* Paginação Móvel */}
                    {temMaisVendas && (
                      <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t">
                        <button
                          onClick={() => mudarPagina(cliente.id, Math.max(1, paginaAtual - 1))}
                          disabled={paginaAtual === 1}
                          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded pagination-btn"
                        >
                          ← Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                          {paginaAtual}/{totalPaginas}
                        </span>
                        <button
                          onClick={() => mudarPagina(cliente.id, Math.min(totalPaginas, paginaAtual + 1))}
                          disabled={paginaAtual === totalPaginas}
                          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded pagination-btn"
                        >
                          Seguinte →
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
              );
            });
          })()}
        </div>
      </div>

              {/* Modal de Venda */}
       {showModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 modal-enter" onClick={handleCloseModal}>
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white modal-content-enter" onClick={e => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editVenda ? 'Editar Venda' : 'Nova Venda'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  {clienteModalNome ? (
                    <input type="text" value={clienteModalNome} disabled className="w-full px-3 py-2 rounded bg-gray-200 text-gray-700 border border-gray-300" />
                  ) : (
                    <select
                      name="clienteId"
                      value={form.clienteId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded bg-gray-200 text-gray-700 border border-gray-300"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  {/* Campos dinâmicos para múltiplos produtos */}
                  {produtos.map((produto, idx) => (
                    <div key={idx} className="border rounded-md p-2 mb-2 bg-gray-50 flex flex-col gap-2 relative">
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-gray-700">Produto</label>
                          <input
                            type="text"
                            value={produto.nomeProduto}
                            onChange={e => handleProdutoChange(idx, 'nomeProduto', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                            required
                            placeholder="Nome do produto"
                            onBlur={() => setTouched(true)}
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                          <input
                            type="number"
                            value={produto.quantidade}
                            onChange={e => handleProdutoChange(idx, 'quantidade', Number(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                            required
                            min="1"
                            placeholder="1"
                            onBlur={() => setTouched(true)}
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-sm font-medium text-gray-700">Preço Revista (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={produto.valorRevista}
                            onChange={e => handleProdutoChange(idx, 'valorRevista', Number(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                            required
                            min="0"
                            placeholder="0,00"
                            onBlur={() => setTouched(true)}
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-sm font-medium text-gray-700">Preço Final (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={produto.valorFinal}
                            onChange={e => handleProdutoChange(idx, 'valorFinal', Number(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                            required
                            min="0"
                            placeholder="0,00"
                            onBlur={() => setTouched(true)}
                          />
                        </div>
                        {produtos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduto(idx)}
                            className="self-end mb-1 ml-2 px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddProduto}
                    className="mt-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    + Adicionar Produto
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                    onBlur={() => setTouched(true)}
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsPrestacoes(!isPrestacoes)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      isPrestacoes 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Pagamento Prestações
                  </button>
                </div>
                {!isFormValid() && touched && (
                  <div className="text-red-500 text-sm font-semibold mb-2">Preencha primeiro os campos acima</div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading || !isFormValid()}
                  >
                    {editVenda ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Venda */}
      <Transition.Root show={showDeleteModal && !!vendaToDelete} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowDeleteModal(false)} />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {vendaToDelete ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-sm text-center pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Eliminar Venda</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja eliminar esta venda? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/vendas', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: vendaToDelete.id }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        toast.error(data.error || 'Erro ao eliminar venda.');
                        setLoading(false);
                        return;
                      }
                      toast.success('Venda eliminada com sucesso!');
                      setShowDeleteModal(false);
                      setVendaToDelete(null);
                      fetchVendas();
                    } catch {
                      toast.error('Erro ao eliminar venda.');
                    } finally {
                      setLoading(false);
                    }
                  }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium" disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
                </div>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>

      {/* Modais no final do componente */}
             {showVerModal && vendaSelecionada && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 modal-enter" onClick={handleFecharVer}>
           <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative text-gray-900 modal-content-enter" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={handleFecharVer}>&times;</button>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-blue-900 mb-1 flex items-center gap-2">Detalhes da Venda</h2>
              <div className="border-b border-gray-200 mb-4"></div>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-600">Cliente:</span>
                  <span className="text-gray-900 font-medium">{vendaSelecionada.cliente?.nome}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-600">Data:</span>
                  <span className="text-gray-900 font-medium">{new Date(vendaSelecionada.data).toLocaleDateString('pt-PT')}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-600">Status:</span>
                  {vendaSelecionada.status === 'PAGO' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Pendente
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Produtos:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {vendaSelecionada.produtos.map((p, i) => (
                      <li key={i} className="text-sm text-gray-900">
                        {p.nomeProduto} (x{p.quantidade}) - €{p.valorFinal.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-600">Valor Pago:</span>
                  <span className="text-gray-900 font-medium">€{vendaSelecionada.valorPago.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-600">Observações:</span>
                  <span className="text-gray-900 font-medium">{vendaSelecionada.observacoes || '-'}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-gray-900">
                <ListaPagamentos
                  vendaId={vendaSelecionada.id}
                  valorFinal={vendaSelecionada.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0)}
                  valorPago={vendaSelecionada.valorPago}
                  onPagamentoAdded={fetchVendas}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showPagamentoModal && vendaSelecionada && (
        <PagamentoModal
          isOpen={showPagamentoModal}
          onClose={handleFecharPagamento}
          vendaId={vendaSelecionada.id}
          valorFinal={vendaSelecionada.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0)}
          valorPago={vendaSelecionada.valorPago}
          onPagamentoAdded={() => { fetchVendas(); handleFecharPagamento(); }}
        />
      )}

      {/* Modal de Abater Dívida */}
      {abaterClienteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Abater Dívida</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a abater (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorAbater}
                onChange={(e) => setValorAbater(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="0,00"
                autoFocus
              />
              {abaterErro && (
                <p className="mt-2 text-sm text-red-600">{abaterErro}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setAbaterClienteId(null);
                  setValorAbater('');
                  setAbaterErro('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={abaterLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const clienteParaAbater = (() => {
                    type ClienteAgrupado = {
                      id: number;
                      nome: string;
                      vendas: any[];
                      totalPago: number;
                      totalEmDivida: number;
                    };
                    const clientesMap: Record<number, ClienteAgrupado> = {};
                    todasVendas.forEach((venda) => {
                      const id = venda.cliente.id;
                      if (!clientesMap[id]) {
                        clientesMap[id] = {
                          id,
                          nome: venda.cliente.nome,
                          vendas: [],
                          totalPago: 0,
                          totalEmDivida: 0,
                        };
                      }
                      const valorTotal = venda.produtos.reduce((a: number, p: any) => a + (p.valorFinal * p.quantidade), 0);
                      clientesMap[id].vendas.push({ ...venda, valorTotal, valorEmDivida: Math.max(0, valorTotal - (venda.valorPago || 0)) });
                      clientesMap[id].totalPago += venda.valorPago || 0;
                      clientesMap[id].totalEmDivida += Math.max(0, valorTotal - (venda.valorPago || 0));
                    });
                    return clientesMap[abaterClienteId];
                  })();
                  if (clienteParaAbater) {
                    handleAbaterDivida(clienteParaAbater);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                disabled={abaterLoading || !valorAbater}
              >
                {abaterLoading ? 'Abatendo...' : 'Abater'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 