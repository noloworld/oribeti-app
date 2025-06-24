'use client';
import React, { useState, useEffect } from 'react';
import { FaEuroSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

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

  const fetchPendentes = async () => {
    try {
      const res = await fetch('/api/vendas');
      const data = await res.json();
      setVendasPendentes((data || []).filter((v: Venda) => v.status === 'PENDENTE'));
    } catch {
      toast.error('Erro ao buscar devedores.');
    }
  };

  useEffect(() => {
    fetchPendentes();
  }, []);

  async function marcarComoPago(venda: Venda) {
    setLoading(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venda,
          clienteId: venda.cliente.id,
          status: 'PAGO',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status alterado para PAGO!');
      fetchPendentes();
      window.dispatchEvent(new Event('devedoresUpdate'));
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
                      onClick={() => marcarComoPago(venda)}
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
    </div>
  );
} 