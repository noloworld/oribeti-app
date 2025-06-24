"use client";
import React, { useEffect, useState, Fragment } from "react";
import { FaEuroSign } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { Transition } from "@headlessui/react";

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({ nome: "", valor: "", data: "" });
  const [despesaEdit, setDespesaEdit] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<any>(null);

  // Buscar despesas ao carregar
  useEffect(() => {
    fetchDespesas();
  }, []);

  async function fetchDespesas() {
    setLoading(true);
    try {
      const res = await fetch("/api/despesas");
      const data = await res.json();
      setDespesas(data);
    } catch {
      toast.error("Erro ao buscar despesas");
    } finally {
      setLoading(false);
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
        toast.error(data.error || "Erro ao adicionar despesa");
      }
    } catch {
      toast.error("Erro ao adicionar despesa");
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

  return (
    <div className="flex flex-col gap-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
        >
          Adicionar nova despesa
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
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
              <tr><td colSpan={4} className="text-center py-8">Carregando...</td></tr>
            ) : despesas.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8">Nenhuma despesa encontrada.</td></tr>
            ) : (
              despesas.map((despesa) => (
                <tr key={despesa.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{despesa.nome}</td>
                  <td className="px-4 py-2">€{Number(despesa.valor).toFixed(2)}</td>
                  <td className="px-4 py-2">{despesa.data.slice(0, 10)}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => { setDespesaEdit({ ...despesa, data: despesa.data.slice(0, 10) }); setModalOpen(true); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >Editar</button>
                    <button
                      onClick={() => { setDespesaToDelete(despesa); setDeleteModalOpen(true); }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setAddModalOpen(false)} />
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
                  <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
                </div>
              </form>
              <button onClick={() => setAddModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setModalOpen(false)} />
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
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
                </div>
              </form>
              <button onClick={() => setModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
            </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDeleteModalOpen(false)} />
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
              <h2 className="text-xl font-bold mb-4 text-red-500">Confirmar Eliminação</h2>
              <p className="mb-6 text-gray-200">Tem certeza que deseja eliminar a despesa <span className="font-semibold">{despesaToDelete.nome}</span>?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                <button onClick={handleDeleteConfirmed} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium">Eliminar</button>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
            </div>
          </div>
        </Transition.Child>
      </Transition.Root>
    </div>
  );
} 