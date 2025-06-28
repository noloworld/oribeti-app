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
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [touched, setTouched] = useState(false);

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
    setLoading(true);
    try {
      // Calcular valor pago corretamente
      const valorPago = isPrestacoes ? Number(form.valorPago || 0) : totalFinal;
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
      setIsPrestacoes(false); // Reset do estado de prestações
      setTouched(false);
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

  // Handlers para abrir/fechar modais
  function handleVisualizarVenda(venda: Venda) {
    setVendaSelecionada(venda);
    setShowVisualizarModal(true);
  }
  function handleFecharVisualizar() {
    setShowVisualizarModal(false);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-600">Gerencie suas vendas e produtos</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total de Vendas */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600">Total de Vendas</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-700">{vendas.length}</span>
        </div>
        {/* Valor Total de Vendas */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600">Valor Total</span>
          <span className="text-xl sm:text-2xl font-bold text-green-700">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalVendas)}
          </span>
        </div>
        {/* Lucro */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600">Lucro</span>
          <span className="text-xl sm:text-2xl font-bold text-yellow-600">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(lucro)}
          </span>
        </div>
        {/* Número de Devedores */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600">Devedores</span>
          <span className="text-xl sm:text-2xl font-bold text-red-600">{devedores.length}</span>
        </div>
        {/* Valor Total Devedores */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600">Valor Devedores</span>
          <span className="text-xl sm:text-2xl font-bold text-red-700">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
              devedores.reduce((acc, v) => acc + (v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0) - (v.valorPago || 0)), 0)
            )}
          </span>
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

      {/* Tabelas de Clientes em Dia e Devedores */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Clientes em Dia */}
        <div>
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            Clientes em Dia
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Produtos</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Pago</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Data</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientesEmDia.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">Nenhum cliente em dia</td></tr>
                  )}
                  {clientesEmDia.map((venda) => (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-medium text-gray-900">{venda.cliente?.nome || 'N/A'}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-gray-700 hidden sm:table-cell">
                        {venda.produtos.map(p => `${p.nomeProduto} (x${p.quantidade})`).join(', ')}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-green-700 font-bold">
                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(venda.valorPago)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-gray-700 hidden md:table-cell">
                        {new Date(venda.data).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap flex gap-1 sm:gap-2">
                        {/* Botões de ação: visualizar, imprimir, eliminar */}
                        <button className="text-blue-600 hover:text-blue-900" title="Visualizar" onClick={() => handleVisualizarVenda(venda)}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                        <button className="text-green-600 hover:text-green-900" title="Imprimir" onClick={() => handlePrintVenda(venda)}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12v7H6z" /></svg></button>
                        <button className="text-red-600 hover:text-red-900" title="Eliminar" onClick={() => { setVendaToDelete(venda); setShowDeleteModal(true); }}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Clientes Devedores */}
        <div>
          <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            Clientes Devedores
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Produtos</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Em Dívida</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Data</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devedores.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">Nenhum devedor</td></tr>
                  )}
                  {devedores.map((venda) => {
                    const valorTotal = venda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0);
                    const valorEmDivida = valorTotal - (venda.valorPago || 0);
                    return (
                      <tr key={venda.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-medium text-gray-900">{venda.cliente?.nome || 'N/A'}</td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-gray-700 hidden sm:table-cell">
                          {venda.produtos.map(p => `${p.nomeProduto} (x${p.quantidade})`).join(', ')}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-red-700 font-bold">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valorEmDivida)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-gray-700 hidden md:table-cell">
                          {new Date(venda.data).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap flex gap-1 sm:gap-2">
                          {/* Botões de ação: visualizar, imprimir, eliminar, adicionar pagamento */}
                          <button className="text-blue-600 hover:text-blue-900" title="Visualizar" onClick={() => handleVisualizarVenda(venda)}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button className="text-green-600 hover:text-green-900" title="Imprimir" onClick={() => handlePrintVenda(venda)}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12v7H6z" /></svg></button>
                          <button className="text-yellow-600 hover:text-yellow-900" title="Adicionar Pagamento" onClick={() => handleAbrirPagamento(venda)}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                          <button className="text-red-600 hover:text-red-900" title="Eliminar" onClick={() => { setVendaToDelete(venda); setShowDeleteModal(true); }}><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Venda */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={handleCloseModal}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
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
                    onBlur={() => setTouched(true)}
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
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPrestacoes((v) => !v)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${isPrestacoes ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                    disabled={!isFormValid()}
                  >
                    {isPrestacoes ? '✓ Pagamento Prestações' : 'Pagamento Prestações'}
                  </button>
                </div>
                {isPrestacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Pago (€)</label>
                    <input
                      type="number"
                      value={form.valorPago}
                      onChange={(e) => setForm({ ...form, valorPago: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      min="0"
                      onBlur={() => setTouched(true)}
                    />
                    <div className="text-sm text-yellow-700 mt-1">
                      Valor em dívida: € {(produtos.reduce((acc, p) => acc + Number(p.valorFinal || 0) * Number(p.quantidade || 1), 0) - Number(form.valorPago || 0)).toFixed(2)}
                    </div>
                  </div>
                )}
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
      {showVisualizarModal && vendaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={handleFecharVisualizar}>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative text-gray-900" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={handleFecharVisualizar}>&times;</button>
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
    </div>
  );
} 