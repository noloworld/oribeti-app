'use client';
import React, { useState, useEffect, Fragment } from 'react';
import { FaEuroSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Transition } from '@headlessui/react';

interface Venda {
  id: number;
  cliente: { id: number; nome: string };
  valorFinal: number;
  data: string;
  status: string;
}

export default function DevedoresPage() {
  const [vendasPendentes, setVendasPendentes] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [vendaToConfirm, setVendaToConfirm] = useState<Venda | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  const fetchPendentes = async () => {
    try {
      const res = await fetch(`/api/vendas?page=${page}&limit=${limit}`);
      const data = await res.json();
      const pendentes = (data.vendas || []).filter((v: Venda) => v.status === 'PENDENTE');
      setVendasPendentes(pendentes);
      setTotal(data.total ? data.total : 0);
    } catch {
      toast.error('Erro ao buscar devedores.');
    }
  };

  useEffect(() => {
    fetchPendentes();
    // eslint-disable-next-line
  }, [page, limit]);

  async function marcarComoPagoConfirmado() {
    if (!vendaToConfirm) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vendaToConfirm,
          clienteId: vendaToConfirm.cliente.id,
          status: 'PAGO',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status alterado para PAGO!');
      fetchPendentes();
      window.dispatchEvent(new Event('devedoresUpdate'));
      setConfirmModalOpen(false);
      setVendaToConfirm(null);
    } catch {
      toast.error('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Clientes Devedores</h1>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Valor em dívida</th>
              <th className="px-4 py-2 text-left">Desde</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendasPendentes.length === 0 ? (
              <tr>
                <td className="px-4 py-2 text-gray-400" colSpan={4}>Nenhum cliente devedor.</td>
              </tr>
            ) : (
              vendasPendentes.map(venda => (
                <tr key={venda.id} className="border-t border-gray-700">
                  <td className="px-4 py-2">{venda.cliente?.nome}</td>
                  <td className="px-4 py-2">€{venda.valorFinal.toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(venda.data).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => { setVendaToConfirm(venda); setConfirmModalOpen(true); }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      disabled={loading}
                    >
                      Pago
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de confirmação de pagamento */}
      <Transition.Root show={confirmModalOpen && !!vendaToConfirm} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setConfirmModalOpen(false)} />
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
            {vendaToConfirm ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-sm text-center pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Confirmar Pagamento</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja marcar como <span className="font-semibold text-green-400">PAGO</span> a venda de <span className="font-semibold">{vendaToConfirm.cliente.nome}</span> no valor de <span className="font-semibold">€{vendaToConfirm.valorFinal.toFixed(2)}</span>?</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setConfirmModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button onClick={marcarComoPagoConfirmado} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium" disabled={loading}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                </div>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
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
    </div>
  );
} 