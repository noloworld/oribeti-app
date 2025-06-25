'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaEuroSign } from 'react-icons/fa';

interface Pagamento {
  id: number;
  valor: number;
  data: string;
  observacoes?: string;
}

interface ListaPagamentosProps {
  vendaId: number;
  valorFinal: number;
  valorPago: number;
  onPagamentoAdded: () => void;
}

export default function ListaPagamentos({ 
  vendaId, 
  valorFinal, 
  valorPago, 
  onPagamentoAdded 
}: ListaPagamentosProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [novoValor, setNovoValor] = useState('');
  const [loadingNovo, setLoadingNovo] = useState(false);

  const valorEmDivida = valorFinal - valorPago;

  const fetchPagamentos = async () => {
    try {
      const res = await fetch(`/api/pagamentos?vendaId=${vendaId}`);
      const data = await res.json();
      setPagamentos(data || []);
    } catch {
      toast.error('Erro ao buscar pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagamentos();
  }, [vendaId]);

  const handleDeletePagamento = async (pagamentoId: number) => {
    if (!confirm('Tem certeza que deseja deletar este pagamento?')) return;

    try {
      const res = await fetch('/api/pagamentos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pagamentoId, vendaId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erro ao deletar pagamento.');
        return;
      }

      toast.success('Pagamento deletado com sucesso!');
      fetchPagamentos();
      onPagamentoAdded();
    } catch {
      toast.error('Erro ao deletar pagamento.');
    }
  };

  const handleAddPagamentoInline = async () => {
    if (!novoValor || isNaN(Number(novoValor)) || Number(novoValor) <= 0) {
      toast.error('Digite um valor válido.');
      return;
    }
    if (Number(novoValor) > valorEmDivida) {
      toast.error(`O valor não pode ser maior que €${valorEmDivida.toFixed(2)}`);
      return;
    }
    setLoadingNovo(true);
    try {
      const res = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendaId,
          valor: novoValor,
          data: new Date().toISOString().split('T')[0],
          observacoes: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao adicionar pagamento.');
        setLoadingNovo(false);
        return;
      }
      setNovoValor('');
      setShowInput(false);
      fetchPagamentos();
      onPagamentoAdded();
      toast.success('Pagamento adicionado!');
    } catch {
      toast.error('Erro ao adicionar pagamento.');
    } finally {
      setLoadingNovo(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-center py-4">Carregando pagamentos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Valor Final:</span>
            <div className="text-white font-semibold">€{valorFinal.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-gray-400">Total Pago:</span>
            <div className="text-green-400 font-semibold">€{valorPago.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-gray-400">Em Dívida:</span>
            <div className={`font-semibold ${valorEmDivida > 0 ? 'text-red-400' : 'text-green-400'}`}>
              €{valorEmDivida.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <div className={`font-semibold ${valorEmDivida > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {valorEmDivida > 0 ? 'PENDENTE' : 'PAGO'}
            </div>
          </div>
        </div>
      </div>

      {/* Aviso de dívida */}
      {valorEmDivida > 0 && (
        <div className="bg-yellow-600 text-white p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-semibold">Cliente ainda deve €{valorEmDivida.toFixed(2)}</div>
              <div className="text-sm opacity-90">
                Desde {new Date(pagamentos[pagamentos.length - 1]?.data || new Date()).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pagamentos */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">Histórico de Pagamentos</h3>
          {valorEmDivida > 0 && !showInput && (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              + Adicionar Pagamento
            </button>
          )}
          {showInput && (
            <div className="flex items-center gap-2">
              <span className="text-gray-300"><FaEuroSign /></span>
              <input
                type="number"
                min="0.01"
                max={valorEmDivida}
                step="0.01"
                value={novoValor}
                onChange={e => setNovoValor(e.target.value)}
                className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 w-24 focus:outline-none"
                placeholder={`0,00 (máx: €${valorEmDivida.toFixed(2)})`}
                disabled={loadingNovo}
              />
              <button
                type="button"
                onClick={handleAddPagamentoInline}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                disabled={loadingNovo}
              >
                {loadingNovo ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInput(false); setNovoValor(''); }}
                className="text-gray-400 hover:text-white text-lg px-2"
                disabled={loadingNovo}
              >×</button>
            </div>
          )}
        </div>

        {pagamentos.length === 0 ? (
          <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-lg">
            Nenhum pagamento registrado ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {pagamentos.map((pagamento) => (
              <div key={pagamento.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-semibold">€{pagamento.valor.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">
                        {new Date(pagamento.data).toLocaleDateString()}
                      </div>
                    </div>
                    {pagamento.observacoes && (
                      <div className="text-gray-300 text-sm max-w-xs">
                        {pagamento.observacoes}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePagamento(pagamento.id)}
                  className="ml-3 text-red-400 hover:text-red-300 text-sm"
                  title="Deletar pagamento"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 