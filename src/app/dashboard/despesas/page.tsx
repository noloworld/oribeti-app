"use client";
import React, { useEffect, useState, Fragment } from "react";
import { FaEuroSign } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { Transition } from "@headlessui/react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useModalAberto } from '../../../components/ModalContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({ nome: "", valor: "", data: "" });
  const [despesaEdit, setDespesaEdit] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<any>(null);
  const [vendas, setVendas] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const { setModalAberto } = useModalAberto();

  // Buscar despesas ao carregar
  useEffect(() => {
    fetchDespesas();
    fetchVendas();
  }, []);

  async function fetchDespesas() {
    setLoading(true);
    try {
      const res = await fetch(`/api/despesas?page=${page}&limit=${limit}`);
      const data = await res.json();
      setDespesas(data.despesas || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Erro ao buscar despesas");
    } finally {
      setLoading(false);
    }
  }

  async function fetchVendas() {
    try {
      const res = await fetch('/api/vendas');
      const data = await res.json();
      setVendas(data);
    } catch {
      toast.error('Erro ao buscar vendas');
    }
  }

  // Adicionar despesa
  async function handleAddSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa),
      });
      if (res.ok) {
        toast.success("Despesa adicionada com sucesso!");
        setAddModalOpen(false);
        setNovaDespesa({ nome: "", valor: "", data: "" });
        fetchDespesas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao acrescentar despesa");
      }
    } catch {
      toast.error("Erro ao acrescentar despesa");
    }
  }

  // Editar despesa
  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    const original = despesas.find((d) => d.id === despesaEdit.id);
    if (
      original.nome === despesaEdit.nome &&
      Number(original.valor) === Number(despesaEdit.valor) &&
      original.data.slice(0, 10) === despesaEdit.data
    ) {
      setModalOpen(false);
      return;
    }
    try {
      const res = await fetch("/api/despesas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...despesaEdit }),
      });
      if (res.ok) {
        toast.success("Despesa editada com sucesso!");
        setModalOpen(false);
        fetchDespesas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao editar despesa");
      }
    } catch {
      toast.error("Erro ao editar despesa");
    }
  }

  // Eliminar despesa
  async function handleDeleteConfirmed() {
    if (!despesaToDelete) return;
    try {
      const res = await fetch("/api/despesas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: despesaToDelete.id }),
      });
      if (res.ok) {
        toast.success("Despesa eliminada com sucesso!");
        fetchDespesas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao eliminar despesa");
      }
    } catch {
      toast.error("Erro ao eliminar despesa");
    } finally {
      setDeleteModalOpen(false);
      setDespesaToDelete(null);
    }
  }

  // Agregar despesas e vendas por mês
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const despesasPorMes = Array(12).fill(0);
  const vendasPorMes = Array(12).fill(0);
  const despesasArray = Array.isArray(despesas) ? despesas : [];
  despesasArray.forEach((d) => {
    const mes = new Date(d.data).getMonth();
    despesasPorMes[mes] += Number(d.valor);
  });
  const vendasArray = Array.isArray(vendas) ? vendas : [];
  vendasArray.forEach((v) => {
    const mes = new Date(v.data).getMonth();
    vendasPorMes[mes] += Number(v.valorFinal);
  });
  const chartData = {
    labels: meses,
    datasets: [
      {
        label: 'Despesas (€)',
        data: despesasPorMes,
        backgroundColor: '#ef4444',
      },
      {
        label: 'Vendas (€)',
        data: vendasPorMes,
        backgroundColor: '#22c55e',
      },
    ],
  };

  useEffect(() => {
    fetchDespesas();
    // eslint-disable-next-line
  }, [page, limit]);

  // Ao abrir modais
  function handleAddOpen() {
    setNovaDespesa({ nome: '', valor: '', data: new Date().toISOString().split('T')[0] });
    setAddModalOpen(true);
    setModalAberto(true);
  }
  function handleEditOpen(despesa: any) {
    setDespesaEdit({ ...despesa, data: despesa.data.slice(0, 10) });
    setModalOpen(true);
    setModalAberto(true);
  }
  function handleDeleteOpen(despesa: any) {
    setDespesaToDelete(despesa);
    setDeleteModalOpen(true);
    setModalAberto(true);
  }
  // Ao fechar modais
  function handleAddModalClose() {
    setAddModalOpen(false);
    setModalAberto(false);
  }
  function handleEditModalClose() {
    setModalOpen(false);
    setModalAberto(false);
  }
  function handleDeleteModalClose() {
    setDeleteModalOpen(false);
    setModalAberto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <button
          onClick={handleAddOpen}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
        >
                      Acrescentar nova despesa
        </button>
      </div>
      {/* Tabela tradicional para desktop */}
      <div className="overflow-x-auto rounded-lg shadow scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block">
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nome da despesa</th>
              <th className="px-4 py-2 text-left">Valor</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">A carregar...</td></tr>
            ) : despesasArray.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8">Nenhuma despesa encontrada.</td></tr>
            ) : (
              despesasArray.map((despesa) => (
                <tr key={despesa.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{despesa.nome}</td>
                  <td className="px-4 py-2">€{Number(despesa.valor).toFixed(2)}</td>
                  <td className="px-4 py-2">{despesa.data.slice(0, 10)}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEditOpen(despesa)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >Editar</button>
                    <button
                      onClick={() => handleDeleteOpen(despesa)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Cards responsivos para mobile */}
      <div className="block md:hidden space-y-8">
        {despesasArray.length === 0 ? (
          <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhuma despesa encontrada.</div>
        ) : (
          despesasArray.map((despesa, idx) => (
            <div key={despesa.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Nome</span>
                <span className="font-bold text-base text-white">{despesa.nome}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Valor</span>
                <span className="font-semibold">€{Number(despesa.valor).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Data</span>
                <span className="font-semibold">{despesa.data.slice(0, 10)}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleEditOpen(despesa)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow">Editar</button>
                <button onClick={() => handleDeleteOpen(despesa)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow">Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal de adição */}
      <Transition.Root show={addModalOpen} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleAddModalClose} />
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
            <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Adicionar Despesa</h2>
              <form onSubmit={handleAddSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nome da despesa</label>
                  <input name="nome" value={novaDespesa.nome} onChange={e => setNovaDespesa({ ...novaDespesa, nome: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaEuroSign /></span>
                    <input name="valor" value={novaDespesa.valor} onChange={e => setNovaDespesa({ ...novaDespesa, valor: e.target.value })} className="w-full pl-8 pr-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Data</label>
                  <input name="data" type="date" value={novaDespesa.data} onChange={e => setNovaDespesa({ ...novaDespesa, data: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={handleAddModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
                </div>
              </form>
              <button onClick={handleAddModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
            </div>
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de edição */}
      <Transition.Root show={modalOpen} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleEditModalClose} />
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
            {despesaEdit ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Editar Despesa</h2>
                <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Nome da despesa</label>
                    <input name="nome" value={despesaEdit.nome} onChange={e => setDespesaEdit({ ...despesaEdit, nome: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaEuroSign /></span>
                      <input name="valor" value={despesaEdit.valor} onChange={e => setDespesaEdit({ ...despesaEdit, valor: e.target.value })} className="w-full pl-8 pr-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Data</label>
                    <input name="data" type="date" value={despesaEdit.data} onChange={e => setDespesaEdit({ ...despesaEdit, data: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={handleEditModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
                  </div>
                </form>
                <button onClick={handleEditModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de confirmação de eliminação */}
      <Transition.Root show={deleteModalOpen && !!despesaToDelete} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleDeleteModalClose} />
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
            {despesaToDelete ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-red-500">Confirmar Eliminação</h2>
                <p className="mb-6 text-gray-200">Tem certeza que deseja eliminar a despesa <span className="font-semibold">{despesaToDelete.nome}</span>?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={handleDeleteModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button onClick={handleDeleteConfirmed} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium">Eliminar</button>
                </div>
                <button onClick={handleDeleteModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Gráfico comparativo despesas vs vendas */}
      <div className="bg-gray-900 rounded-lg p-6 shadow flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white mb-2">Comparativo Despesas x Vendas (por mês)</h2>
        <div className="w-full max-w-2xl mx-auto" style={{height: 350}}>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, maintainAspectRatio: false }} height={350} />
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
    </div>
  );
} 