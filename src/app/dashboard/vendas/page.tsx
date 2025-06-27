"use client";

import React, { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { Transition } from '@headlessui/react';
import ListaPagamentos from '../../../components/ListaPagamentos';
import { useModalAberto } from '../../../components/ModalContext';

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validação simples
    if (!form.clienteId || !form.data) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      // Calcular valor pago automaticamente
      const valorPago = isPrestacoes ? Number(form.valorPago || 0) : Number(form.valorFinal);
      
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: form.clienteId,
          produtos,
          observacoes: form.observacoes,
          data: form.data,
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
      setIsPrestacoes(false); // Reset do estado de prestações
      fetchVendas();
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

  // Calcular totais das vendas para cards de resumo
  const totalVendas = vendas.reduce((acc, v) => acc + v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0), 0);
  const totalRevistaVendas = vendas.reduce((acc, v) => acc + v.produtos.reduce((pacc, p) => pacc + (p.valorRevista * p.quantidade), 0), 0);
  const lucro = totalVendas - totalRevistaVendas;

  // Corrigir filtro de clientes em dia e devedores
  const clientesEmDia = vendas.filter(v => v.valorPago >= v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0));
  const devedores = vendas.filter(v => v.valorPago < v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-600">Gerencie suas vendas e produtos</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-semibold text-gray-900">{vendas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pago</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendas - totalRevistaVendas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevistaVendas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Adicionar Venda */}
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar Venda
        </button>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{venda.cliente?.nome || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{venda.produtos[0].nomeProduto}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{venda.produtos[0].quantidade}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.produtos[0].valorRevista)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.produtos[0].valorFinal)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(venda.data).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venda.valorPago >= venda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {venda.valorPago >= venda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditModal(venda)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setVendaToDelete(venda);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Venda */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editVenda ? 'Editar Venda' : 'Nova Venda'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <select
                    value={form.clienteId || ''}
                    onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Produto</label>
                  <input
                    type="text"
                    value={form.nomeProduto}
                    onChange={(e) => setForm({ ...form, nomeProduto: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input
                    type="number"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço Unitário</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorRevista}
                    onChange={(e) => setForm({ ...form, valorRevista: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                    min="0"
                  />
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
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={form.status === 'PAGO'}
                    onChange={(e) => setForm({ ...form, status: e.target.checked ? 'PAGO' : 'PENDENTE' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="block text-sm text-gray-900">Pago</label>
                  <button
                    type="button"
                    onClick={() => setIsPrestacoes((v) => !v)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${isPrestacoes ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                  >
                    {isPrestacoes ? '✓ Pagamento Prestações' : 'Pagamento Prestações'}
                  </button>
                </div>
                {isPrestacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Pago</label>
                    <input
                      type="number"
                      value={form.valorPago}
                      onChange={(e) => setForm({ ...form, valorPago: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      min="0"
                    />
                    <div className="text-sm text-yellow-700 mt-1">
                      Valor em dívida: € {(Number(form.valorFinal) - Number(form.valorPago || 0)).toFixed(2)}
                    </div>
                  </div>
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
    </div>
  );
} 