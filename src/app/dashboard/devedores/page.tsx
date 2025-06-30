'use client';
import React, { useState, useEffect } from 'react';
import { FaEuroSign, FaHistory, FaUser, FaCalendar, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import PagamentoModal from '@/components/PagamentoModal';

interface VendaProduto {
  id: number;
  nomeProduto: string;
  quantidade: number;
  valorRevista: number;
  valorFinal: number;
}

interface Pagamento {
  id: number;
  valor: number;
  data: string;
  observacoes?: string;
}

interface Venda {
  id: number;
  data: string;
  status: string;
  valorPago: number;
  observacoes?: string;
  produtos: VendaProduto[];
  pagamentos: Pagamento[];
  valorFinal: number;
  valorEmDivida: number;
  numPagamentos: number;
  foiDevedor: boolean;
}

interface EstatisticasCliente {
  totalVendas: number;
  vendasEmAberto: number;
  vendasPagasParcelado: number;
  totalDevido: number;
  valorMaxDevido: number;
  ultimaVenda: string | null;
  ultimoPagamento: string | null;
}

interface Cliente {
  id: number;
  nome: string;
  vendas: Venda[];
  estatisticas: EstatisticasCliente;
}

interface ModalPagamentoState {
  aberto: boolean;
  venda: Venda | null;
  cliente: Cliente | null;
}

export default function DevedoresPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteExpandido, setClienteExpandido] = useState<number | null>(null);
  const [modalPagamento, setModalPagamento] = useState<ModalPagamentoState>({
    aberto: false,
    venda: null,
    cliente: null
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/devedores');
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch (error) {
      toast.error('Erro ao buscar clientes devedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const toggleCliente = (clienteId: number) => {
    setClienteExpandido(clienteId === clienteExpandido ? null : clienteId);
  };

  const getStatusBadge = (venda: Venda) => {
    if (venda.status === 'PAGO') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="w-3 h-3 mr-1" />
          Pago
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaClock className="w-3 h-3 mr-1" />
        Pendente
      </span>
    );
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-PT');
  };

  const handleAbrirModalPagamento = (venda: Venda, cliente: Cliente) => {
    setModalPagamento({
      aberto: true,
      venda,
      cliente
    });
  };

  const handleFecharModalPagamento = () => {
    setModalPagamento({
      aberto: false,
      venda: null,
      cliente: null
    });
  };

  const handlePagamentoSucesso = () => {
    handleFecharModalPagamento();
    fetchClientes(); // Recarregar dados
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Histórico de Devedores</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Histórico de Devedores</h1>
      
      {clientes.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-400">Não há clientes que tenham sido devedores no sistema.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {clientes.filter(c => c.estatisticas.totalDevido > 0).map((cliente) => (
            <div key={cliente.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Cabeçalho do Cliente */}
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => toggleCliente(cliente.id)}
              >
                {/* Layout Desktop */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <FaUser className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{cliente.nome}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                        <span>Total de vendas: {cliente.estatisticas.totalVendas}</span>
                        <span>•</span>
                        <span>Em aberto: {cliente.estatisticas.vendasEmAberto}</span>
                        <span>•</span>
                        <span>Pagas parcelado: {cliente.estatisticas.vendasPagasParcelado}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      €{cliente.estatisticas.totalDevido.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">Total em dívida</div>
                    <div className="flex items-center justify-end mt-2">
                      <FaHistory className="w-4 h-4 text-blue-400 mr-1" />
                      <span className="text-sm text-blue-400">Ver histórico</span>
                    </div>
                  </div>
                </div>

                {/* Layout Mobile */}
                <div className="block sm:hidden">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">{cliente.nome}</h3>
                      <div className="text-lg font-bold text-white mt-1">
                        €{cliente.estatisticas.totalDevido.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">Total em dívida</div>
                      
                      {/* Estatísticas Mobile */}
                      <div className="space-y-1 text-sm text-gray-300 mb-3">
                        <div>Total de vendas: {cliente.estatisticas.totalVendas}</div>
                        <div>Em aberto: {cliente.estatisticas.vendasEmAberto}</div>
                        <div>Pagas parcelado: {cliente.estatisticas.vendasPagasParcelado}</div>
                      </div>
                      
                      {/* Ver histórico sempre visível no mobile */}
                      <div className="flex items-center">
                        <FaHistory className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm text-blue-400 font-medium">Ver histórico</span>
                        <span className="ml-2 text-gray-400">{clienteExpandido === cliente.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico Expandido */}
              {clienteExpandido === cliente.id && (
                <div className="border-t border-gray-700 bg-gray-900">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FaHistory className="w-5 h-5 mr-2 text-blue-400" />
                      Vendas a Prestações Ativas
                    </h4>
                    
                    <div className="space-y-4">
                      {cliente.vendas.filter(v => v.status === 'PENDENTE' || v.valorEmDivida > 0).map((venda) => (
                        <div key={venda.id} className="bg-gray-800 rounded-lg p-4">
                          {/* Cabeçalho da Venda */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FaCalendar className="w-4 h-4 text-gray-400" />
                              <span className="text-white font-medium">
                                {formatarData(venda.data)}
                              </span>
                              {getStatusBadge(venda)}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                €{venda.valorFinal.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-400">Valor total</div>
                            </div>
                          </div>

                          {/* Produtos */}
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Produtos:</h5>
                            <div className="space-y-2">
                              {venda.produtos.map((produto) => (
                                <div key={produto.id} className="flex justify-between items-center bg-gray-700 rounded px-3 py-2">
                                  <div>
                                    <span className="text-white font-medium">{produto.nomeProduto}</span>
                                    <span className="text-gray-400 ml-2">x{produto.quantidade}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white">€{produto.valorFinal.toFixed(2)}</div>
                                    <div className="text-xs text-gray-400">€{produto.valorRevista.toFixed(2)} revista</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resumo de Pagamento */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-gray-700 rounded p-3">
                              <div className="text-sm text-gray-400">Valor pago</div>
                              <div className="text-lg font-bold text-green-400">
                                €{venda.valorPago.toFixed(2)}
                              </div>
                            </div>
                            <div className="bg-gray-700 rounded p-3">
                              <div className="text-sm text-gray-400">Em dívida</div>
                              <div className={`text-lg font-bold ${venda.valorEmDivida > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                €{venda.valorEmDivida.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Histórico de Pagamentos */}
                          {venda.pagamentos.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-2">
                                Pagamentos ({venda.numPagamentos}):
                              </h5>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {venda.pagamentos.map((pagamento) => (
                                  <div key={pagamento.id} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                                    <div className="flex items-center space-x-3">
                                      <FaEuroSign className="w-4 h-4 text-green-400" />
                                      <span className="text-white font-medium">
                                        €{pagamento.valor.toFixed(2)}
                                      </span>
                                      <span className="text-gray-400 text-sm">
                                        {formatarData(pagamento.data)}
                                      </span>
                                    </div>
                                    {pagamento.observacoes && (
                                      <span className="text-gray-400 text-sm italic">
                                        {pagamento.observacoes}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botão para adicionar pagamento */}
                          {venda.valorEmDivida > 0 && (
                            <div className="mt-3">
                              <button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirModalPagamento(venda, cliente);
                                }}
                              >
                                Adicionar Pagamento
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Pagamento */}
      {modalPagamento.aberto && modalPagamento.venda && (
        <PagamentoModal
          isOpen={modalPagamento.aberto}
          onClose={handleFecharModalPagamento}
          vendaId={modalPagamento.venda.id}
          valorFinal={modalPagamento.venda.valorFinal}
          valorPago={modalPagamento.venda.valorPago || 0}
          onPagamentoAdded={handlePagamentoSucesso}
        />
      )}
    </div>
  );
} 