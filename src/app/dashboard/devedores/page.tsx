'use client';
import React, { useState, useEffect, Fragment } from 'react';
import { FaEuroSign, FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Transition } from '@headlessui/react';
import { useModalAberto } from '../../../components/ModalContext';

interface Venda {
  id: number;
  cliente: { id: number; nome: string };
  valorFinal: number;
  valorPago?: number;
  data: string;
  status: string;
  nomeProduto: string;
}

interface Pagamento {
  id: number;
  valor: number;
  data: string;
  observacoes?: string;
}

export default function DevedoresPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState<number | null>(null);
  const [pagamentos, setPagamentos] = useState<Record<number, Pagamento[]>>({});
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [vendaToConfirm, setVendaToConfirm] = useState<Venda | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const { setModalAberto } = useModalAberto();

  // Novo estado para vendas filtradas (devedores)
  const [vendasFiltradas, setVendasFiltradas] = useState<Venda[]>([]);

  const fetchVendas = async () => {
    try {
      const res = await fetch(`/api/vendas?page=${page}&limit=${limit}`);
      const data = await res.json();
      setVendas(data.vendas || []);
      setTotal(data.total ? data.total : 0);
    } catch {
      toast.error('Erro ao buscar vendas.');
    }
  };

  const fetchPagamentos = async (vendaId: number) => {
    try {
      const res = await fetch(`/api/pagamentos?vendaId=${vendaId}`);
      const data = await res.json();
      setPagamentos(prev => ({ ...prev, [vendaId]: data || [] }));
    } catch {
      toast.error('Erro ao buscar histórico de pagamentos.');
    }
  };

  // Função para filtrar devedores
  function filtrarDevedores(vendas: Venda[]) {
    return vendas.filter(venda => {
      // Pagando às prestações: já pagou algo, mas não tudo
      if ((venda.valorPago || 0) > 0 && (venda.valorPago || 0) < venda.valorFinal) return true;
      // Já pagou tudo parcelado: valorPago >= valorFinal e mais de um pagamento
      if ((venda.valorPago || 0) >= venda.valorFinal && (venda as any).numPagamentos > 1) return true;
      return false;
    });
  }

  // Atualizar vendas filtradas sempre que vendas mudarem
  useEffect(() => {
    const filtradas = filtrarDevedores(vendas);
    setTotal(filtradas.length);
    setVendasFiltradas(filtradas);
    setPage(1); // Sempre volta para a primeira página ao filtrar
  }, [vendas]);

  // Paginação sobre vendasFiltradas
  const vendasPaginadas = vendasFiltradas.slice((page - 1) * limit, page * limit);

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
          valorPago: vendaToConfirm.valorFinal,
          status: 'PAGO',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status alterado para PAGO!');
      fetchVendas();
      window.dispatchEvent(new Event('devedoresUpdate'));
      setConfirmModalOpen(false);
      setVendaToConfirm(null);
    } catch {
      toast.error('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  }

  // Função para determinar o artigo correto (um/uma) para o produto
  function artigoProduto(nomeProduto: string) {
    const femininos = [
      'argola', 'pulseira', 'corrente', 'caneta', 'anel', 'camiseta', 'blusa', 'bolsa', 'corrente', 'moeda', 'pulseira', 'colher', 'cesta', 'caixa', 'camisa', 'carteira', 'jaqueta', 'roupa', 'sandália', 'meia', 'joia', 'joia', 'joias', 'joalheria', 'prata', 'corrente', 'aliança', 'gargantilha', 'corrente', 'correntes', 'alianças', 'gargantilhas', 'pulseiras', 'argolas', 'blusas', 'camisas', 'bolsas', 'carteiras', 'moedas', 'caixas', 'roupas', 'sandálias', 'meias', 'joias', 'joalherias', 'pratas', 'colheres', 'cestas', 'canetas', 'camisetas', 'jaquetas'
    ];
    const nome = nomeProduto.trim().toLowerCase();
    for (const fem of femininos) {
      if (nome.startsWith(fem)) return 'uma';
    }
    return 'um';
  }

  function handleConfirmOpen(venda: Venda) {
    setVendaToConfirm(venda);
    setConfirmModalOpen(true);
    setModalAberto(true);
  }

  function handleConfirmModalClose() {
    setConfirmModalOpen(false);
    setVendaToConfirm(null);
    setModalAberto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Clientes Devedores</h1>
      {/* Tabela tradicional para desktop */}
      <div className="overflow-x-auto rounded-lg shadow scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block">
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Valor máximo devido</th>
              <th className="px-4 py-2 text-left">Valor em dívida</th>
              <th className="px-4 py-2 text-left">Último pagamento</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (vendasPaginadas.length === 0) {
                return (
                  <tr>
                    <td className="px-4 py-2 text-gray-400" colSpan={5}>Nenhum cliente devedor.</td>
                  </tr>
                );
              }
              return vendasPaginadas.map(venda => {
                const valorEmDivida = venda.valorFinal - (venda.valorPago || 0);
                const historico = pagamentos[venda.id] || [];
                const valorMaxDevido = Math.max(venda.valorFinal, ...historico.map(p => p.valor));
                const ultimoPagamento = historico.length > 0 ? historico[0] : null;
                const pagandoPrestacoes = (venda.valorPago || 0) > 0 && (venda.valorPago || 0) < venda.valorFinal;
                return (
                  <React.Fragment key={venda.id}>
                    <tr className="border-t border-gray-700">
                      <td className="px-4 py-2">
                        {venda.cliente?.nome}
                        {pagandoPrestacoes && (
                          <div className="text-yellow-400 text-xs font-semibold mt-1">Ainda está a pagar</div>
                        )}
                      </td>
                      <td className="px-4 py-2">€{valorMaxDevido.toFixed(2)}</td>
                      <td className={`px-4 py-2 ${pagandoPrestacoes ? 'text-yellow-400 font-bold' : ''}`}>€{valorEmDivida.toFixed(2)}</td>
                      <td className="px-4 py-2">{ultimoPagamento ? new Date(ultimoPagamento.data).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => {
                            if (historicoAberto === venda.id) {
                              setHistoricoAberto(null);
                            } else {
                              setHistoricoAberto(venda.id);
                              if (!pagamentos[venda.id]) fetchPagamentos(venda.id);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <FaHistory /> Histórico
                        </button>
                      </td>
                    </tr>
                    {historicoAberto === venda.id && (
                      <tr>
                        <td colSpan={5} className="bg-gray-900 px-6 py-4">
                          <div className="mb-2 text-yellow-400 font-semibold">
                            {venda.nomeProduto}
                          </div>
                          <div className="mb-2 text-yellow-300 text-sm">
                            Este cliente já pagou {(venda as any).numPagamentos}x um {venda.nomeProduto} de €{venda.valorFinal.toFixed(2)}, ainda falta pagar <span className="font-bold text-orange-400">€{(venda.valorFinal - (venda.valorPago || 0)).toFixed(2)}</span>.
                          </div>
                          <div className="space-y-2 overflow-y-auto max-h-[25vh] md:max-h-64 scrollbar-custom">
                            {historico.length === 0 ? (
                              <div className="text-gray-400 text-center py-2">Nenhum pagamento registrado.</div>
                            ) : (
                              historico.map((p, idx) => (
                                <div key={p.id || idx} className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-2">
                                  <div className="text-green-400 font-bold text-lg">€{p.valor.toFixed(2)}</div>
                                  <div className="text-gray-300 text-sm">{new Date(p.data).toLocaleDateString()}</div>
                                  {p.observacoes && <div className="text-gray-400 text-xs italic">{p.observacoes}</div>}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
      {/* Cards responsivos para mobile */}
      <div className="block md:hidden space-y-8">
        {(() => {
          if (vendasPaginadas.length === 0) {
            return (
              <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente devedor.</div>
            );
          }
          return vendasPaginadas.map((venda, idx) => {
            const valorEmDivida = venda.valorFinal - (venda.valorPago || 0);
            const historico = pagamentos[venda.id] || [];
            const valorMaxDevido = Math.max(venda.valorFinal, ...historico.map(p => p.valor));
            const ultimoPagamento = historico.length > 0 ? historico[0] : null;
            const pagandoPrestacoes = (venda.valorPago || 0) > 0 && (venda.valorPago || 0) < venda.valorFinal;
            return (
              <div key={venda.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Cliente</span>
                  <span className="font-bold text-base text-white">{venda.cliente?.nome}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Valor máximo devido</span>
                  <span className="font-semibold">€{valorMaxDevido.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Valor em dívida</span>
                  <span className={`font-semibold ${pagandoPrestacoes ? 'text-yellow-400' : ''}`}>€{valorEmDivida.toFixed(2)}</span>
                </div>
                {pagandoPrestacoes && (
                  <div className="text-yellow-400 text-xs font-semibold">Ainda está a pagar</div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Último pagamento</span>
                  <span className="font-semibold">{ultimoPagamento ? new Date(ultimoPagamento.data).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (historicoAberto === venda.id) {
                        setHistoricoAberto(null);
                      } else {
                        setHistoricoAberto(venda.id);
                        if (!pagamentos[venda.id]) fetchPagamentos(venda.id);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[90px] shadow flex items-center gap-1"
                  >
                    <FaHistory /> Histórico
                  </button>
                </div>
                {/* Histórico expandido */}
                {historicoAberto === venda.id && (
                  <div className="bg-gray-900 mt-3 rounded-lg p-3">
                    <div className="mb-2 text-yellow-400 font-semibold">{venda.nomeProduto}</div>
                    <div className="mb-2 text-yellow-300 text-sm">
                      Este cliente já pagou {(venda as any).numPagamentos}x um {venda.nomeProduto} de €{venda.valorFinal.toFixed(2)}, ainda falta pagar <span className="font-bold text-orange-400">€{valorEmDivida.toFixed(2)}</span>.
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[25vh] md:max-h-64 scrollbar-custom">
                      {historico.length === 0 ? (
                        <div className="text-gray-400 text-center py-2">Nenhum pagamento registrado.</div>
                      ) : (
                        historico.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-2">
                            <div className="text-green-400 font-bold text-lg">€{p.valor.toFixed(2)}</div>
                            <div className="text-gray-300 text-sm">{new Date(p.data).toLocaleDateString()}</div>
                            {p.observacoes && <div className="text-gray-400 text-xs italic">{p.observacoes}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
      {/* Modal de confirmação de pagamento */}
      {confirmModalOpen && vendaToConfirm && (
        <Transition.Root show={confirmModalOpen} as={Fragment}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={handleConfirmModalClose} />
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
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-sm text-center pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Confirmar Pagamento</h2>
                <p className="text-gray-300 mb-6">Tem certeza que deseja marcar como <span className="font-semibold text-green-400">PAGO</span> a venda de <span className="font-semibold">{vendaToConfirm.cliente.nome}</span> no valor de <span className="font-semibold">€{(vendaToConfirm.valorFinal - (vendaToConfirm.valorPago || 0)).toFixed(2)}</span>?</p>
                <div className="flex justify-center gap-4">
                  <button onClick={handleConfirmModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button onClick={marcarComoPagoConfirmado} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium" disabled={loading}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </Transition.Root>
      )}
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