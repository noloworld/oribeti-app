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
    return <div className="p-8 text-center text-gray-300">Carregando dashboard...</div>;
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-700 text-white rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-lg font-semibold">Total de Clientes</div>
          <div className="text-3xl font-bold mt-2">{data.totalClientes}</div>
        </div>
        <div className="bg-green-700 text-white rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-lg font-semibold">Total de Vendas</div>
          <div className="text-3xl font-bold mt-2">{data.totalVendas}</div>
        </div>
        <div className="bg-purple-700 text-white rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-lg font-semibold">Total Ganho</div>
          <div className="text-3xl font-bold mt-2">€ {data.totalGanho.toFixed(2)}</div>
        </div>
        <div className="bg-yellow-600 text-white rounded-lg p-4 shadow flex flex-col items-center">
          <div className="text-lg font-semibold">Clientes Devedores</div>
          <div className="text-3xl font-bold mt-2">{data.clientesDevedores.length}</div>
        </div>
      </div>

      {/* Gráfico de vendas */}
      <div className="bg-gray-900 rounded-lg p-6 shadow flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
          <h2 className="text-xl font-bold text-white">Gráfico de Vendas</h2>
          <select
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none mt-2 md:mt-0"
            value={tipoGrafico}
            onChange={e => setTipoGrafico(e.target.value as 'mes' | 'ano')}
          >
            <option value="mes">Por mês (ano atual)</option>
            <option value="ano">Por ano</option>
          </select>
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-2xl" style={{height: 350}}>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }} height={350} />
          </div>
        </div>
      </div>

      {/* Top 5 clientes e Últimos clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 clientes */}
        <div className="bg-gray-900 rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-white mb-4">Top 5 Clientes</h2>
          <ol className="space-y-2">
            {data.top5Clientes.length === 0 && (
              <li className="text-gray-400">Nenhum cliente com vendas pagas.</li>
            )}
            {data.top5Clientes.map((c, i) => (
              <li key={c.id} className="flex justify-between items-center bg-gray-800 rounded px-4 py-2">
                <span className="font-semibold text-white">{i + 1}. {c.nome}</span>
                <span className="text-green-400 font-bold">€ {c.totalGasto.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </div>
        {/* Últimos clientes adicionados */}
        <div className="bg-gray-900 rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-white mb-4">Últimos Clientes Adicionados</h2>
          <ol className="space-y-2">
            {data.ultimosClientes.length === 0 && (
              <li className="text-gray-400">Nenhum cliente cadastrado.</li>
            )}
            {data.ultimosClientes.map((c) => (
              <li key={c.id} className="flex justify-between items-center bg-gray-800 rounded px-4 py-2">
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
                <th className="px-4 py-2 text-left">Venda</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Valor Total</th>
                <th className="px-4 py-2 text-left">Valor Pago</th>
                <th className="px-4 py-2 text-left">Em Dívida</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.clientesDevedores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-gray-400 px-4 py-2">Nenhum cliente devedor.</td>
                </tr>
              ) : (
                data.clientesDevedores.flatMap((c) =>
                  c.vendas.map((v, idx) => (
                    <tr key={c.id + '-' + v.vendaId} className="border-b border-gray-800">
                      <td className="px-4 py-2">{c.nome}</td>
                      <td className="px-4 py-2">#{v.vendaId}</td>
                      <td className="px-4 py-2">{new Date(v.data).toLocaleDateString()}</td>
                      <td className="px-4 py-2">€ {v.valorTotal.toFixed(2)}</td>
                      <td className="px-4 py-2">€ {v.valorPago.toFixed(2)}</td>
                      <td className="px-4 py-2 text-yellow-400 font-bold">€ {v.valorEmDivida.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          onClick={() => { setVendaSelecionada({ ...v, cliente: c.nome }); setShowVendaModal(true); }}
                        >
                          Mais informações
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
        {/* Cards responsivos para mobile */}
        <div className="block md:hidden space-y-4">
          {data.clientesDevedores.length === 0 ? (
            <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente devedor.</div>
          ) : (
            data.clientesDevedores.flatMap((c) =>
              c.vendas.map((v, idx) => (
                <div key={c.id + '-' + v.vendaId} className="bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-base">{c.nome}</span>
                    <span className="text-xs text-gray-400">#{v.vendaId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Data</span>
                    <span className="text-white">{new Date(v.data).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Valor Total</span>
                    <span className="text-white font-semibold">€ {v.valorTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Valor Pago</span>
                    <span className="text-green-400 font-semibold">€ {v.valorPago.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Em Dívida</span>
                    <span className="text-yellow-400 font-bold">€ {v.valorEmDivida.toFixed(2)}</span>
                  </div>
                  <button
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs shadow w-full"
                    onClick={() => { setVendaSelecionada({ ...v, cliente: c.nome }); setShowVendaModal(true); }}
                  >
                    Mais informações
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {showVendaModal && vendaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative text-gray-900">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setShowVendaModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-900">Detalhes da Venda</h2>
            <div className="mb-2"><b>Cliente:</b> {vendaSelecionada.cliente}</div>
            <div className="mb-2"><b>Venda:</b> #{vendaSelecionada.vendaId}</div>
            <div className="mb-2"><b>Data:</b> {new Date(vendaSelecionada.data).toLocaleDateString()}</div>
            <div className="mb-2"><b>Valor Total:</b> €{vendaSelecionada.valorTotal.toFixed(2)}</div>
            <div className="mb-2"><b>Valor Pago:</b> €{vendaSelecionada.valorPago.toFixed(2)}</div>
            <div className="mb-2"><b>Em Dívida:</b> <span className="text-yellow-600 font-bold">€{vendaSelecionada.valorEmDivida.toFixed(2)}</span></div>
            <div className="mb-2"><b>Observações:</b> <span className="text-gray-900 font-medium">{vendaSelecionada.observacoes || '-'}</span></div>
            <div className="mt-4">
              <ListaPagamentos
                vendaId={vendaSelecionada.vendaId}
                valorFinal={vendaSelecionada.valorTotal}
                valorPago={vendaSelecionada.valorPago}
                onPagamentoAdded={() => setShowVendaModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 