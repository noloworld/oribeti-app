"use client";

import React, { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { Transition } from '@headlessui/react';

interface Cliente {
  id: number;
  nome: string;
}

interface Venda {
  id: number;
  cliente: { id: number; nome: string };
  nomeProduto: string;
  valorRevista: number;
  valorFinal: number;
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

  // Manipulação do formulário
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ADICIONAR CÁLCULO AUTOMÁTICO DO VALOR EM DÍVIDA
  const valorEmDivida = Number(form.valorFinal) - Number(form.valorPago || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validação simples
    if (!form.clienteId || !form.nomeProduto || !form.valorRevista || !form.valorFinal || !form.data || !form.status) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: form.clienteId,
          nomeProduto: form.nomeProduto,
          valorRevista: form.valorRevista,
          valorFinal: form.valorFinal,
          valorPago: form.valorPago,
          observacoes: form.observacoes,
          data: form.data,
          status: form.status,
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
      setForm({ clienteId: '', nomeProduto: '', valorRevista: '', valorFinal: '', valorPago: '', observacoes: '', data: '', status: 'PENDENTE' });
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
    doc.text(venda.nomeProduto, 40, y + 6);
    doc.text(`€${venda.valorFinal.toFixed(2)}`, 120, y + 6);
    doc.text(`€${venda.valorFinal.toFixed(2)}`, 170, y + 6, { align: 'right' });
    // Totais
    y += 18;
    const subtotal = venda.valorFinal / 1.23;
    const iva = venda.valorFinal - subtotal;
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
    doc.text(`€${venda.valorFinal.toFixed(2)}`, 170, y, { align: 'right' });
    // Rodapé
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Obrigado pela sua compra!', 105, 285, { align: 'center' });
    doc.save(`fatura_${venda.cliente?.nome?.replace(/\s+/g, '_') || 'cliente'}_${dataAtual}.pdf`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Registo de Vendas</h1>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Total Vendido</div>
          <div className="text-2xl font-bold mt-2">€ {vendas.reduce((acc, v) => acc + (v.valorFinal || 0), 0).toFixed(2)}</div>
        </div>
        <div className="bg-blue-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Vendas do Mês</div>
          <div className="text-2xl font-bold mt-2">€ {vendas.filter(v => new Date(v.data).getMonth() === new Date().getMonth()).reduce((acc, v) => acc + (v.valorFinal || 0), 0).toFixed(2)}</div>
        </div>
        <div className="bg-yellow-600 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Nº de Vendas</div>
          <div className="text-2xl font-bold mt-2">{vendas.length}</div>
        </div>
        <div className="bg-purple-700 text-white rounded-lg p-4 shadow">
          <div className="text-lg font-semibold">Lucro</div>
          <div className="text-2xl font-bold mt-2">€ {vendas.reduce((acc, v) => acc + ((v.valorFinal || 0) - (v.valorRevista || 0)), 0).toFixed(2)}</div>
        </div>
      </div>
      {/* Botão adicionar venda */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition"
          onClick={() => setShowModal(true)}
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
      {/* Tabela de vendas */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-gray-300">Data</th>
              <th className="px-4 py-2 text-left text-gray-300">Cliente</th>
              <th className="px-4 py-2 text-left text-gray-300">Produto</th>
              <th className="px-4 py-2 text-left text-gray-300">Valor Revista (€)</th>
              <th className="px-4 py-2 text-left text-gray-300">Valor Final (€)</th>
              <th className="px-4 py-2 text-left text-gray-300">Valor Pago (€)</th>
              <th className="px-4 py-2 text-left text-gray-300">Em Dívida (€)</th>
              <th className="px-4 py-2 text-left text-gray-300">Status</th>
              <th className="px-4 py-2 text-left text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.filter(v => (statusFiltro === 'TODOS' ? true : v.status === statusFiltro)
              && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)
            ).length === 0 ? (
              <tr>
                <td className="px-4 py-2 text-gray-400" colSpan={9}>
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            ) : (
              vendas.filter(v => (statusFiltro === 'TODOS' ? true : v.status === statusFiltro)
                && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)
              ).map((v) => (
                <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                  <td className="px-4 py-2 text-gray-200">{new Date(v.data).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-gray-200">{v.cliente?.nome}</td>
                  <td className="px-4 py-2 text-gray-200">{v.nomeProduto}</td>
                  <td className="px-4 py-2 text-gray-200">€ {v.valorRevista.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-200">€ {v.valorFinal.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-200">€ {(v.valorPago || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-200">€ {(v.valorFinal - (v.valorPago || 0)).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        (v.valorFinal - (v.valorPago || 0)) <= 0
                          ? 'bg-green-600 text-white px-3 py-1 rounded font-semibold'
                          : 'bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold'
                      }
                    >
                      {(v.valorFinal - (v.valorPago || 0)) <= 0 ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditVenda(v);
                        setShowEditModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setVendaToDelete(v);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => handlePrintVenda(v)}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm"
                    >
                      Imprimir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Componente de paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-gray-400 text-sm">
          Página {page} de {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded ${p === page ? 'bg-green-600 text-white font-bold' : 'bg-gray-700 text-white'}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >Próxima</button>
          <select
            className="ml-4 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
          >
            {[5, 10, 20, 50].map(opt => (
              <option key={opt} value={opt}>{opt} por página</option>
            ))}
          </select>
        </div>
      </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowModal(false)} />
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
            <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
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
                  <label className="block text-gray-300 mb-1">Produto</label>
                  <input type="text" name="nomeProduto" value={form.nomeProduto} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="Nome do produto" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Valor Revista (€)</label>
                  <input type="number" name="valorRevista" min="0" step="0.01" value={form.valorRevista} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="0,00" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Valor Final (€)</label>
                  <input type="number" name="valorFinal" min="0" step="0.01" value={form.valorFinal} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="0,00" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Valor Pago (€)</label>
                  <input type="number" name="valorPago" min="0" step="0.01" value={form.valorPago} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="0,00" />
                </div>
                {valorEmDivida > 0 && (
                  <div className="bg-yellow-600 text-white p-2 rounded text-sm">
                    Valor em dívida: €{valorEmDivida.toFixed(2)}
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="Ex: vai pagar o resto no próximo mês" rows={3} />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none">
                    <option value="PAGO">Pago</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                    onClick={() => setShowModal(false)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowEditModal(false)} />
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
              <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Editar Venda</h2>
                <form className="flex flex-col gap-4" onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  // Verificar se houve alteração real
                  const original = vendas.find(v => v.id === editVenda.id);
                  if (
                    original &&
                    original.nomeProduto === editVenda.nomeProduto &&
                    original.valorRevista === editVenda.valorRevista &&
                    original.valorFinal === editVenda.valorFinal &&
                    original.status === editVenda.status &&
                    original.data.slice(0,10) === editVenda.data.slice(0,10)
                  ) {
                    setShowEditModal(false); // Nada mudou, só fecha o modal
                    setEditVenda(null);
                    setLoading(false);
                    return;
                  }
                  try {
                    const res = await fetch('/api/vendas', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editVenda.id,
                        clienteId: editVenda.cliente.id,
                        nomeProduto: editVenda.nomeProduto,
                        valorRevista: editVenda.valorRevista,
                        valorFinal: editVenda.valorFinal,
                        valorPago: editVenda.valorPago || 0,
                        observacoes: editVenda.observacoes || '',
                        data: editVenda.data,
                        status: editVenda.status,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      toast.error(data.error || 'Erro ao editar venda.');
                      setLoading(false);
                      return;
                    }
                    toast.success('Venda editada com sucesso!');
                    setShowEditModal(false);
                    setEditVenda(null);
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
                    <input type="date" value={editVenda.data.slice(0,10)} onChange={e => setEditVenda({ ...editVenda, data: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Cliente</label>
                    <div className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700">
                      {editVenda.cliente.nome}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Produto</label>
                    <input type="text" value={editVenda.nomeProduto} onChange={e => setEditVenda({ ...editVenda, nomeProduto: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Valor Revista (€)</label>
                    <input type="number" min="0" step="0.01" value={editVenda.valorRevista} onChange={e => setEditVenda({ ...editVenda, valorRevista: Number(e.target.value) })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Valor Final (€)</label>
                    <input type="number" min="0" step="0.01" value={editVenda.valorFinal} onChange={e => setEditVenda({ ...editVenda, valorFinal: Number(e.target.value) })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Valor Pago (€)</label>
                    <input type="number" min="0" step="0.01" value={editVenda.valorPago || 0} onChange={e => setEditVenda({ ...editVenda, valorPago: Number(e.target.value) })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  {(editVenda.valorFinal - (editVenda.valorPago || 0)) > 0 && (
                    <div className="bg-yellow-600 text-white p-2 rounded text-sm">
                      Valor em dívida: €{(editVenda.valorFinal - (editVenda.valorPago || 0)).toFixed(2)}
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-300 mb-1">Observações</label>
                    <textarea value={editVenda.observacoes || ''} onChange={e => setEditVenda({ ...editVenda, observacoes: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" placeholder="Ex: vai pagar o resto no próximo mês" rows={3} />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Status</label>
                    <select value={editVenda.status} onChange={e => setEditVenda({ ...editVenda, status: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none">
                      <option value="PAGO">Pago</option>
                      <option value="PENDENTE">Pendente</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600" onClick={() => setShowEditModal(false)} disabled={loading}>Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
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