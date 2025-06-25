'use client';

import React, { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

interface PagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendaId: number;
  valorFinal: number;
  valorPago: number;
  onPagamentoAdded: () => void;
}

export default function PagamentoModal({ 
  isOpen, 
  onClose, 
  vendaId, 
  valorFinal, 
  valorPago, 
  onPagamentoAdded 
}: PagamentoModalProps) {
  const [form, setForm] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);

  const valorEmDivida = valorFinal - valorPago;
  const valorMaximo = valorEmDivida;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.valor || !form.data) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const valor = Number(form.valor);
    if (valor <= 0) {
      toast.error('O valor deve ser maior que zero.');
      return;
    }

    if (valor > valorMaximo) {
      toast.error(`O valor não pode ser maior que €${valorMaximo.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendaId,
          valor: form.valor,
          data: form.data,
          observacoes: form.observacoes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao adicionar pagamento.');
        return;
      }

      toast.success('Pagamento adicionado com sucesso!');
      setForm({
        valor: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
      onPagamentoAdded();
      onClose();
    } catch {
      toast.error('Erro ao adicionar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose} />
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
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Pagamento</h2>
            
            <div className="bg-yellow-600 text-white p-3 rounded mb-4">
              <div className="text-sm font-medium">Valor em dívida: €{valorEmDivida.toFixed(2)}</div>
              <div className="text-xs">Valor máximo para este pagamento</div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-300 mb-1">Valor do Pagamento (€)</label>
                <input
                  type="number"
                  min="0.01"
                  max={valorMaximo}
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
                  placeholder={`0,00 (máx: €${valorMaximo.toFixed(2)})`}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Data do Pagamento</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Observações (opcional)</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
                  placeholder="Ex: pagamento parcial, segunda prestação..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Adicionar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition.Child>
    </Transition.Root>
  );
} 