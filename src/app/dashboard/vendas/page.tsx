"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
    fetch("/api/vendas")
      .then((res) => res.json())
      .then((data) => setVendas(data || []));
  };
  useEffect(() => {
    fetchVendas();
  }, []);

  // Manipulação do formulário
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

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
      setForm({ clienteId: '', nomeProduto: '', valorRevista: '', valorFinal: '', data: '', status: 'PENDENTE' });
      fetchVendas();
    } catch {
      toast.error('Erro ao registrar venda.');
    } finally {
      setLoading(false);
    }
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
              <th className="px-4 py-2 text-left text-gray-300">Status</th>
              <th className="px-4 py-2 text-left text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.filter(v => (statusFiltro === 'TODOS' ? true : v.status === statusFiltro)
              && (anoFiltro === 'TODOS' ? true : new Date(v.data).getFullYear().toString() === anoFiltro)
            ).length === 0 ? (
              <tr>
                <td className="px-4 py-2 text-gray-400" colSpan={7}>
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
                  <td className="px-4 py-2">
                    <span
                      className={
                        v.status === 'PAGO'
                          ? 'bg-green-600 text-white px-3 py-1 rounded font-semibold'
                          : v.status === 'PENDENTE'
                          ? 'bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold'
                          : ''
                      }
                    >
                      {v.status}
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Nova Venda */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative"
            onClick={e => e.stopPropagation()}
          >
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
      )}
      {/* Modal de Editar Venda */}
      {showEditModal && editVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
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
        </div>
      )}
      {/* Modal de Eliminar Venda */}
      {showDeleteModal && vendaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
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
        </div>
      )}
    </div>
  );
} 