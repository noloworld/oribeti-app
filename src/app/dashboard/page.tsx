"use client";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ListaPagamentos from '../../components/ListaPagamentos';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardData {
  totalClientes: number;
  totalVendas: number;
  totalVendido: number;
  totalGanho: number;
  clientesDevedores: Array<{
    id: number;
    nome: string;
    vendas: Array<{
      vendaId: number;
      data: string;
      valorTotal: number;
      valorPago: number;
      valorEmDivida: number;
      pagamentos: any[];
    }>;
  }>;
  vendasPorMes: Array<{ mes: number; total: number }>;
  vendasPorAno: Array<{ ano: number; total: number }>;
  top5Clientes: Array<{
    id: number;
    nome: string;
    totalGasto: number;
  }>;
  ultimosClientes: Array<{
    id: number;
    nome: string;
    criadoEm: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoGrafico, setTipoGrafico] = useState<'mes' | 'ano'>("mes");
  const [vendaSelecionada, setVendaSelecionada] = useState<any | null>(null);
  const [showVendaModal, setShowVendaModal] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-300">A carregar dashboard...</div>;
  }
  if (!data) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar dados do dashboard.</div>;
  }

  // Gráfico de vendas
  const chartData = tipoGrafico === "mes"
    ? {
        labels: [
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ],
        datasets: [
          {
            label: "Vendas por mês (€)",
            data: data.vendasPorMes.map((v) => v.total),
            backgroundColor: "#2563eb",
          },
        ],
      }
    : {
        labels: data.vendasPorAno.map((v) => v.ano.toString()),
        datasets: [
          {
            label: "Vendas por ano (€)",
            data: data.vendasPorAno.map((v) => v.total),
            backgroundColor: "#22c55e",
          },
        ],
      };

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Alerta de clientes devedores */}
      {data.clientesDevedores.length > 0 && (
        <div className="bg-red-700 text-white rounded-lg p-4 shadow text-center text-lg font-semibold">
          Atenção: Existem clientes com pagamentos pendentes!
        </div>
      )}

      {/* Cards de totais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-700 text-white rounded-lg p-4 shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <div className="text-lg font-semibold">Total de Clientes</div>
          <div className="text-3xl font-bold mt-2 transition-all duration-300">{data.totalClientes}</div>
        </div>
        <div className="bg-green-700 text-white rounded-lg p-4 shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="text-lg font-semibold">Total de Vendas</div>
          <div className="text-3xl font-bold mt-2 transition-all duration-300">{data.totalVendas}</div>
        </div>
        <div className="bg-indigo-700 text-white rounded-lg p-4 shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="text-lg font-semibold">Total Vendido</div>
          <div className="text-3xl font-bold mt-2 transition-all duration-300">€ {data.totalVendido.toFixed(2)}</div>
        </div>
        <div className="bg-purple-700 text-white rounded-lg p-4 shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="text-lg font-semibold">Total Ganho</div>
          <div className="text-3xl font-bold mt-2 transition-all duration-300">€ {data.totalGanho.toFixed(2)}</div>
        </div>
        <div className="bg-yellow-600 text-white rounded-lg p-4 shadow flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <div className="text-lg font-semibold">Clientes Devedores</div>
          <div className="text-3xl font-bold mt-2 transition-all duration-300">{data.clientesDevedores.length}</div>
        </div>
      </div>

      {/* Gráfico de vendas */}
      <div className="bg-gray-900 rounded-lg p-6 shadow flex flex-col gap-4 transform transition-all duration-700 hover:shadow-xl animate-fade-in-up" style={{animationDelay: '0.6s'}}>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
          <h2 className="text-xl font-bold text-white">Gráfico de Vendas</h2>
          <select
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none mt-2 md:mt-0 transition-all duration-300 hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            value={tipoGrafico}
            onChange={e => setTipoGrafico(e.target.value as 'mes' | 'ano')}
          >
            <option value="mes">Por mês (ano atual)</option>
            <option value="ano">Por ano</option>
          </select>
        </div>
        <div className="w-full flex justify-center transform transition-all duration-500">
          <div className="w-full max-w-2xl" style={{height: 350}}>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }} height={350} />
          </div>
        </div>
      </div>

      {/* Top 5 clientes e Últimos clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 clientes */}
        <div className="bg-gray-900 rounded-lg p-6 shadow transform transition-all duration-700 hover:shadow-xl animate-fade-in-left" style={{animationDelay: '0.7s'}}>
          <h2 className="text-lg font-bold text-white mb-4">Top 5 Clientes</h2>
          <ol className="space-y-2">
            {data.top5Clientes.length === 0 && (
              <li className="text-gray-400">Nenhum cliente com vendas pagas.</li>
            )}
            {data.top5Clientes.map((c, i) => (
              <li key={c.id} className="flex justify-between items-center bg-gray-800 rounded px-4 py-2 transform transition-all duration-300 hover:bg-gray-700 hover:scale-102 animate-fade-in-right" style={{animationDelay: `${0.8 + i * 0.1}s`}}>
                <span className="font-semibold text-white">{i + 1}. {c.nome}</span>
                <span className="text-green-400 font-bold">€ {c.totalGasto.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </div>
        {/* Últimos clientes adicionados */}
        <div className="bg-gray-900 rounded-lg p-6 shadow transform transition-all duration-700 hover:shadow-xl animate-fade-in-right" style={{animationDelay: '0.7s'}}>
          <h2 className="text-lg font-bold text-white mb-4">Últimos Clientes Adicionados</h2>
          <ol className="space-y-2">
            {data.ultimosClientes.length === 0 && (
              <li className="text-gray-400">Nenhum cliente cadastrado.</li>
            )}
            {data.ultimosClientes.map((c, i) => (
              <li key={c.id} className="flex justify-between items-center bg-gray-800 rounded px-4 py-2 transform transition-all duration-300 hover:bg-gray-700 hover:scale-102 animate-fade-in-left" style={{animationDelay: `${0.8 + i * 0.1}s`}}>
                <span className="font-semibold text-white">{c.nome}</span>
                <span className="text-gray-400 text-xs">{new Date(c.criadoEm).toLocaleDateString()}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Lista de clientes devedores */}
      <div className="bg-gray-900 rounded-lg p-6 shadow">
        <h2 className="text-lg font-bold text-white mb-4">Clientes Devedores</h2>
        {/* Tabela tradicional para desktop */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Vendas em Dívida</th>
                <th className="px-4 py-2 text-left">Total em Dívida</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.clientesDevedores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-gray-400 px-4 py-2">Nenhum cliente devedor.</td>
                </tr>
              ) : (
                data.clientesDevedores.map((c) => {
                  const totalEmDivida = c.vendas.reduce((sum, v) => sum + v.valorEmDivida, 0);
                  return (
                    <tr key={c.id} className="border-b border-gray-800">
                      <td className="px-4 py-2 font-semibold">{c.nome}</td>
                      <td className="px-4 py-2">{c.vendas.length} venda{c.vendas.length > 1 ? 's' : ''}</td>
                      <td className="px-4 py-2 text-yellow-400 font-bold">€ {totalEmDivida.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          onClick={() => { setVendaSelecionada({ cliente: c, vendas: c.vendas }); setShowVendaModal(true); }}
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Cards responsivos para mobile */}
        <div className="block md:hidden space-y-4">
          {data.clientesDevedores.length === 0 ? (
            <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente devedor.</div>
          ) : (
            data.clientesDevedores.map((c) => {
              const totalEmDivida = c.vendas.reduce((sum, v) => sum + v.valorEmDivida, 0);
              return (
                <div key={c.id} className="bg-gray-800 rounded-xl p-4 shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-white text-base">{c.nome}</span>
                    <span className="text-yellow-400 font-bold">€ {totalEmDivida.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-gray-400">Vendas em dívida:</span>
                    <span className="text-white">{c.vendas.length} venda{c.vendas.length > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm shadow w-full"
                    onClick={() => { setVendaSelecionada({ cliente: c, vendas: c.vendas }); setShowVendaModal(true); }}
                  >
                    Ver Detalhes
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showVendaModal && vendaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={() => setShowVendaModal(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative text-gray-900" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setShowVendaModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-900">Vendas em Dívida - {vendaSelecionada.cliente.nome}</h2>
            
            <div className="space-y-4">
              {vendaSelecionada.vendas.map((venda, index) => (
                <div key={venda.vendaId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Venda #{venda.vendaId}</h3>
                    <span className="text-sm text-gray-600">{new Date(venda.data).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-600">Valor Total:</span>
                      <div className="font-semibold">€ {venda.valorTotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Valor Pago:</span>
                      <div className="font-semibold text-green-600">€ {venda.valorPago.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Em Dívida:</span>
                      <div className="font-bold text-yellow-600">€ {venda.valorEmDivida.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Pagamentos:</span>
                      <div className="font-semibold">{venda.pagamentos.length} pagamento{venda.pagamentos.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <div className="mt-3">
              <ListaPagamentos
                      vendaId={venda.vendaId}
                      valorFinal={venda.valorTotal}
                      valorPago={venda.valorPago}
                      onPagamentoAdded={() => {
                        // Recarregar dados do dashboard
                        fetch("/api/dashboard/summary")
                          .then((res) => res.json())
                          .then((d) => setData(d));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total em Dívida:</span>
                <span className="text-xl font-bold text-yellow-600">
                  € {vendaSelecionada.vendas.reduce((sum, v) => sum + v.valorEmDivida, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 