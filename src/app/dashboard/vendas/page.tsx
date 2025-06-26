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
  const [form, setForm] = useState({
    clienteId: '',
    nomeProduto: '',
    valorRevista: '',
    valorFinal: '',
    valorPago: '',
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
      setForm({ clienteId: '', nomeProduto: '', valorRevista: '', valorFinal: '', valorPago: '', observacoes: '', data: '', status: 'PENDENTE' });
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
      <h1 className="text-2xl font-bold mb-6 text-white">Registo de Vendas</h1>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Total Vendido</div>
          <div className="text-2xl font-bold mt-2">€ {totalVendas.toFixed(2)}</div>
        </div>
        <div className="bg-blue-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Vendas do Mês</div>
          <div className="text-2xl font-bold mt-2">€ {vendas.filter(v => new Date(v.data).getMonth() === new Date().getMonth()).reduce((acc, v) => acc + (v.produtos.reduce((pacc, p) => pacc + (p.valorFinal * p.quantidade), 0)), 0).toFixed(2)}</div>
        </div>
        <div className="bg-yellow-600 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Nº de Vendas</div>
          <div className="text-2xl font-bold mt-2">{vendas.length}</div>
        </div>
        <div className="bg-purple-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Lucro</div>
          <div className="text-2xl font-bold mt-2">€ {lucro.toFixed(2)}</div>
        </div>
      </div>
      {/* Botão adicionar venda */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition"
          onClick={handleOpenModal}
        >
          + Nova Venda
        </button>
      </div>
      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-medium">Filtrar por status:</label>
          <select
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value as 'TODOS' | 'PAGO' | 'PENDENTE')}
          >
            <option value="TODOS">Todos</option>
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-medium">Filtrar por ano:</label>
          <select
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
            value={anoFiltro}
            onChange={e => setAnoFiltro(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {anosDisponiveis.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Tabelas separadas */}
      <div className="space-y-8">
        {/* Tabela de Clientes em Dia */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-green-400">Clientes em Dia</h2>
          {/* Botões de ação em lote */}
          {selecionados.length > 0 && (
            <div className="flex gap-4 mb-2">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
                onClick={() => handleEliminarSelecionados(vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) <= 0 && (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)))}
              >
                Eliminar selecionados
              </button>
              <button
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-medium"
                onClick={() => handleImprimirSelecionados(vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) <= 0 && (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)))}
              >
                Imprimir selecionados
              </button>
            </div>
          )}
          {/* Tabela tradicional para desktop */}
          <div className="overflow-x-auto scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block">
            <table className="min-w-full bg-gray-800 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">
                    <input
                      type="checkbox"
                      checked={vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) <= 0 && (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro))).every(v => selecionados.includes(v.id)) && vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) <= 0 && (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro))).length > 0}
                      onChange={() => toggleSelecionarTodos(vendas.filter(v => (v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) <= 0 && (statusFiltro === 'TODOS' ? true : v.status === statusFiltro) && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro))))}
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-gray-300">Data</th>
                  <th className="px-4 py-2 text-left text-gray-300">Cliente</th>
                  <th className="px-4 py-2 text-left text-gray-300">Produto</th>
                  <th className="px-4 py-2 text-left text-gray-300">Valor Revista (€)</th>
                  <th className="px-4 py-2 text-left text-gray-300">Valor Final (€)</th>
                  <th className="px-4 py-2 text-left text-gray-300">Valor Pago (€)</th>
                  <th className="px-4 py-2 text-left text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  v.produtos.map((p, idx) => (
                    <tr key={v.id + '-' + p.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                      {idx === 0 && (
                        <>
                          <td rowSpan={v.produtos.length} className="px-4 py-2 text-gray-200">{new Date(v.data).toLocaleDateString()}</td>
                          <td rowSpan={v.produtos.length} className="px-4 py-2 text-gray-200">{v.cliente?.nome}</td>
                        </>
                      )}
                      <td className="px-4 py-2 text-gray-200">{p.nomeProduto}</td>
                      <td className="px-4 py-2 text-gray-200">{p.quantidade}</td>
                      <td className="px-4 py-2 text-gray-200">€ {p.valorRevista.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-200">€ {p.valorFinal.toFixed(2)}</td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={v.produtos.length} className="px-4 py-2 text-gray-200">€ {(v.valorPago || 0).toFixed(2)}</td>
                          <td rowSpan={v.produtos.length} className="px-4 py-2">
                            <span className={`inline-block px-4 py-1 rounded-md font-bold shadow-md text-sm tracking-wide ${v.valorPago >= v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>{v.valorPago >= v.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) ? 'Pago' : 'Pendente'}</span>
                          </td>
                          <td rowSpan={v.produtos.length} className="px-4 py-2">Ações</td>
                        </>
                      )}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards responsivos para mobile */}
          <div className="block md:hidden space-y-8">
            {vendasEmDiaMobile.length === 0 ? (
              <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente em dia.</div>
            ) : (
              <div>
                {vendasPaginaMobile.map((venda, idx) => (
                  <div key={venda.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Data</span>
                      <span className="font-semibold">{new Date(venda.data).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Cliente</span>
                      <span className="font-bold text-base text-white">{venda.cliente?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Produto</span>
                      <span className="font-bold text-base text-green-300">{venda.produtos[0].nomeProduto}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Valor Revista (€)</span>
                      <span className="font-semibold">€{venda.produtos[0].valorRevista.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Valor Final (€)</span>
                      <span className="font-semibold">€{venda.produtos[0].valorFinal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Valor Pago (€)</span>
                      <span className="font-semibold">€{(venda.valorPago || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Status</span>
                      <span className="inline-block bg-green-600 text-white px-4 py-1 rounded-md font-bold shadow-md text-sm tracking-wide">Pago</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleOpenEditModal(venda)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setVendaToDelete(venda);
                          setShowDeleteModal(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => handlePrintVenda(venda)}
                        className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow"
                      >
                        Imprimir
                      </button>
                    </div>
                  </div>
                ))}
                {/* Paginação mobile */}
                {totalPaginasMobile > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-2">
                    <button
                      className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50"
                      onClick={() => setMobilePage(p => Math.max(1, p - 1))}
                      disabled={mobilePage === 1}
                    >«</button>
                    {Array.from({ length: totalPaginasMobile }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded text-sm ${p === mobilePage ? 'bg-green-600 text-white font-bold' : 'bg-gray-700 text-white'}`}
                        onClick={() => setMobilePage(p)}
                      >{p}</button>
                    ))}
                    <button
                      className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50"
                      onClick={() => setMobilePage(p => Math.min(totalPaginasMobile, p + 1))}
                      disabled={mobilePage === totalPaginasMobile}
                    >»</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Devedores */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Devedores</h2>
          {/* Tabela tradicional para desktop */}
          <div className="overflow-x-auto scrollbar-custom max-h-[40vh] md:max-h-96 rounded-lg shadow hidden md:block">
            <table className="min-w-full bg-gray-800 text-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Produto</th>
                  <th className="px-4 py-2 text-left">Valor final (€)</th>
                  <th className="px-4 py-2 text-left">Valor pago (€)</th>
                  <th className="px-4 py-2 text-left">Em dívida (€)</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {devedoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-gray-400 px-4 py-2 text-center">Nenhum cliente devedor.</td>
                  </tr>
                ) : (
                  devedoresFiltrados.map((v) => (
                    <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                      <td className="px-4 py-2 text-gray-200">{new Date(v.data).toLocaleDateString('pt-PT')}</td>
                      <td className="px-4 py-2 text-gray-200">{v.cliente?.nome}</td>
                      <td className="px-4 py-2 text-gray-200">{v.produtos[0].nomeProduto}</td>
                      <td className="px-4 py-2 text-gray-200">€ {v.produtos[0].valorFinal.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-200">€ {(v.valorPago || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-yellow-400 font-bold">€ {(v.produtos[0].valorFinal - (v.valorPago || 0)).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold">
                          Em dívida
                        </span>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Adicionar pagamento
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Cards responsivos para mobile */}
          <div className="block md:hidden space-y-6">
            {devedoresFiltrados.length === 0 ? (
              <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente devedor.</div>
            ) : (
              devedoresFiltrados.map((v, idx) => (
                <div key={v.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Data</span>
                    <span className="font-semibold">{new Date(v.data).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Cliente</span>
                    <span className="font-bold text-base text-white">{v.cliente?.nome}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Produto</span>
                    <span className="font-semibold">{v.produtos[0].nomeProduto}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Valor final (€)</span>
                    <span className="font-semibold">€ {v.produtos[0].valorFinal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Valor pago (€)</span>
                    <span className="font-semibold">€ {(v.valorPago || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Em dívida (€)</span>
                    <span className="font-semibold text-yellow-400">€ {(v.produtos[0].valorFinal - (v.valorPago || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Estado</span>
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold">Em dívida</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs min-w-[120px] shadow"
                    >
                      Adicionar pagamento
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Paginação moderna centralizada */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >«</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-green-600 text-white font-bold' : 'bg-gray-700 text-white'}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >»</button>
        </div>
      )}

      {/* Modal de Nova Venda */}
      <Transition.Root show={showModal} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={handleCloseModal} />
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
            <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative pointer-events-auto max-h-[90vh] overflow-y-auto scrollbar-custom">
              <h2 className="text-xl font-bold text-white mb-4">Nova Venda</h2>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-300 mb-1">Data</label>
                  <input type="date" name="data" value={form.data} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Cliente</label>
                  <select
                    name="clienteId"
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
                    value={form.clienteId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Produtos</label>
                  {produtos.map((produto, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-end">
                      <input type="text" placeholder="Nome do produto" className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.nomeProduto} onChange={e => handleProdutoChange(idx, 'nomeProduto', e.target.value)} required />
                      <input type="number" min="1" placeholder="Qtd" className="w-full md:w-16 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.quantidade} onChange={e => handleProdutoChange(idx, 'quantidade', e.target.value)} required />
                      <input type="number" min="0" step="0.01" placeholder="Valor Revista (€)" className="w-full md:w-28 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.valorRevista} onChange={e => handleProdutoChange(idx, 'valorRevista', e.target.value)} required />
                      <input type="number" min="0" step="0.01" placeholder="Valor Final (€)" className="w-full md:w-28 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.valorFinal} onChange={e => handleProdutoChange(idx, 'valorFinal', e.target.value)} required />
                      {produtos.length > 1 && (
                        <button type="button" className="text-red-400 hover:text-red-600 text-lg font-bold px-2" onClick={() => handleRemoveProduto(idx)}>-</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="mt-1 px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 text-sm" onClick={handleAddProduto}>+ Adicionar produto</button>
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="text-gray-300">Total Revista: <span className="font-bold">€ {totalRevista.toFixed(2)}</span></div>
                  <div className="text-gray-300">Total Final: <span className="font-bold">€ {totalFinal.toFixed(2)}</span></div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="Ex: vai pagar o resto no próximo mês" rows={3} />
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
                    {isPrestacoes ? '✓ Pagamento Prestações' : 'Pagamento Prestações'}
                  </button>
                  {!isPrestacoes && (
                    <span className="text-green-400 text-sm">Pagamento total à vista</span>
                  )}
                </div>
                {isPrestacoes && (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-1">Valor Pago (€)</label>
                      <input type="number" name="valorPago" min="0" step="0.01" value={form.valorPago} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="0,00" />
                    </div>
                    {totalFinal - Number(form.valorPago || 0) > 0 && (
                      <div className="bg-yellow-600 text-white p-2 rounded text-sm">
                        Valor em dívida: €{(totalFinal - Number(form.valorPago || 0)).toFixed(2)}
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de Editar Venda */}
      <Transition.Root show={showEditModal && !!editVenda} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={handleCloseEditModal} />
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
            {editVenda ? (
              <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative pointer-events-auto max-h-[90vh] overflow-y-auto scrollbar-custom">
                <h2 className="text-xl font-bold text-white mb-4">
                  {isEditPrestacoes ? 'Adicionar Pagamento' : 'Editar Venda'}
                </h2>
                <form className="flex flex-col gap-4" onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  
                  // Se for apenas adicionar pagamento, não salvar alterações nos campos
                  if (isEditPrestacoes) {
                    handleCloseEditModal();
                    setLoading(false);
                    return;
                  }
                  
                  // Verificar se houve alteração real
                  const original = vendas.find(v => v.id === editVenda.id);
                  if (
                    original &&
                    original.produtos.every((p, idx) => p.nomeProduto === editVenda.produtos[idx].nomeProduto && p.valorRevista === editVenda.produtos[idx].valorRevista && p.valorFinal === editVenda.produtos[idx].valorFinal && p.quantidade === editVenda.produtos[idx].quantidade) &&
                    original.valorPago === editVenda.valorPago &&
                    original.observacoes === editVenda.observacoes &&
                    original.data.slice(0,10) === editVenda.data.slice(0,10)
                  ) {
                    handleCloseEditModal(); // Nada mudou, só fecha o modal
                    setLoading(false);
                    return;
                  }
                  try {
                    // Calcular valor pago automaticamente
                    const valorPago = isEditPrestacoes ? Number(editVenda.valorPago || 0) : Number(editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0));
                    
                    const res = await fetch('/api/vendas', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editVenda.id,
                        clienteId: editVenda.cliente.id,
                        produtos: editVenda.produtos,
                        observacoes: editVenda.observacoes || '',
                        data: editVenda.data,
                        status: 'PENDENTE', // Será calculado automaticamente na API
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      toast.error(data.error || 'Erro ao editar venda.');
                      setLoading(false);
                      return;
                    }
                    toast.success('Venda editada com sucesso!');
                    handleCloseEditModal();
                    setIsEditPrestacoes(false); // Reset do estado de prestações
                    fetchVendas();
                    window.dispatchEvent(new Event('devedoresUpdate'));
                  } catch {
                    toast.error('Erro ao editar venda.');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <div>
                    <label className="block text-gray-300 mb-1">Data</label>
                    <input 
                      type="date" 
                      value={editVenda.data.slice(0,10)} 
                      onChange={e => setEditVenda({ ...editVenda, data: e.target.value })} 
                      className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" 
                      disabled={isEditPrestacoes}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Cliente</label>
                    <div className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700">
                      {editVenda.cliente.nome}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Produtos</label>
                    {editVenda.produtos.map((produto, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-end">
                        <input type="text" placeholder="Nome do produto" className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.nomeProduto} onChange={e => handleProdutoChange(idx, 'nomeProduto', e.target.value)} required />
                        <input type="number" min="1" placeholder="Qtd" className="w-full md:w-16 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.quantidade} onChange={e => handleProdutoChange(idx, 'quantidade', e.target.value)} required />
                        <input type="number" min="0" step="0.01" placeholder="Valor Revista (€)" className="w-full md:w-28 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.valorRevista} onChange={e => handleProdutoChange(idx, 'valorRevista', e.target.value)} required />
                        <input type="number" min="0" step="0.01" placeholder="Valor Final (€)" className="w-full md:w-28 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" value={produto.valorFinal} onChange={e => handleProdutoChange(idx, 'valorFinal', e.target.value)} required />
                        {editVenda.produtos.length > 1 && (
                          <button type="button" className="text-red-400 hover:text-red-600 text-lg font-bold px-2" onClick={() => handleRemoveProduto(idx)}>-</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="mt-1 px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 text-sm" onClick={handleAddProduto}>+ Adicionar produto</button>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-gray-300">Total Revista: <span className="font-bold">€ {totalRevista.toFixed(2)}</span></div>
                    <div className="text-gray-300">Total Final: <span className="font-bold">€ {totalFinal.toFixed(2)}</span></div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Observações</label>
                    <textarea name="observacoes" value={editVenda.observacoes} onChange={e => setEditVenda({ ...editVenda, observacoes: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="Ex: vai pagar o resto no próximo mês" rows={3} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setIsEditPrestacoes(!isEditPrestacoes)}
                      disabled={(editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) > 0) || (editVenda.valorPago >= editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0))}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        isEditPrestacoes 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${(editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) > 0 || editVenda.valorPago >= editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isEditPrestacoes ? '✓ Pagamento Prestações' : 'Pagamento Prestações'}
                    </button>
                    {!isEditPrestacoes && (
                      <span className="text-green-400 text-sm">Pagamento total à vista</span>
                    )}
                    {(editVenda.produtos.reduce((acc, p) => acc + (p.valorFinal * p.quantidade), 0) > 0 &&
                      <span className="text-yellow-400 text-sm">Venda em prestações - use "Adicionar Pagamento"</span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600" onClick={handleCloseEditModal} disabled={loading}>Cancelar</button>
                    {!isEditPrestacoes && (
                      <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                    )}
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
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