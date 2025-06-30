"use client";
import React, { useEffect, useState, Fragment } from "react";
import { FaEuroSign } from "react-icons/fa";
import toast from 'react-hot-toast';
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
import EmlUploader from '../../../components/EmlUploader';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({ nome: "", valor: "", data: "" });
  const [produtos, setProdutos] = useState([{ nome: "", quantidade: "1", preco: "" }]);
  const [despesaExpandida, setDespesaExpandida] = useState<number | null>(null);
  const [despesaEdit, setDespesaEdit] = useState<any>(null);
  const [produtosEdit, setProdutosEdit] = useState([{ nome: "", quantidade: "1", preco: "" }]);
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
    
    // Validar se há pelo menos um produto com dados válidos
    const produtosValidos = produtos.filter(p => p.nome.trim() && p.preco.trim());
    if (produtosValidos.length === 0) {
      toast.error("Acrescente pelo menos um produto válido");
      return;
    }
    
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaDespesa,
          produtos: produtosValidos
        }),
      });
      if (res.ok) {
        toast.success("Despesa adicionada com sucesso!");
        setAddModalOpen(false);
        setNovaDespesa({ nome: "", valor: "", data: "" });
        setProdutos([{ nome: "", quantidade: "1", preco: "" }]);
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
    
    // Validar se há pelo menos um produto com dados válidos
    const produtosValidos = produtosEdit.filter(p => p.nome.trim() && p.preco.trim());
    if (produtosValidos.length === 0) {
      toast.error("Acrescente pelo menos um produto válido");
      return;
    }
    
    try {
      const res = await fetch("/api/despesas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...despesaEdit,
          produtos: produtosValidos
        }),
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

  // Funções para gerenciar produtos
  function adicionarProduto() {
    setProdutos([...produtos, { nome: "", quantidade: "1", preco: "" }]);
  }
  
  function removerProduto(index: number) {
    if (produtos.length > 1) {
      setProdutos(produtos.filter((_, i) => i !== index));
    }
  }
  
  function atualizarProduto(index: number, campo: string, valor: string) {
    const novosProdutos = [...produtos];
    novosProdutos[index] = { ...novosProdutos[index], [campo]: valor };
    setProdutos(novosProdutos);
  }
  
  // Calcular valor total dos produtos
  function calcularValorTotal() {
    return produtos.reduce((total, produto) => {
      const quantidade = parseInt(produto.quantidade) || 0;
      const preco = parseFloat(produto.preco) || 0;
      return total + (quantidade * preco);
    }, 0);
  }
  
  // Funções para gerenciar produtos na edição
  function adicionarProdutoEdit() {
    setProdutosEdit([...produtosEdit, { nome: "", quantidade: "1", preco: "" }]);
  }
  
  function removerProdutoEdit(index: number) {
    if (produtosEdit.length > 1) {
      setProdutosEdit(produtosEdit.filter((_, i) => i !== index));
    }
  }
  
  function atualizarProdutoEdit(index: number, campo: string, valor: string) {
    const novosProdutos = [...produtosEdit];
    novosProdutos[index] = { ...novosProdutos[index], [campo]: valor };
    setProdutosEdit(novosProdutos);
  }
  
  // Calcular valor total dos produtos na edição
  function calcularValorTotalEdit() {
    return produtosEdit.reduce((total, produto) => {
      const quantidade = parseInt(produto.quantidade) || 0;
      const preco = parseFloat(produto.preco) || 0;
      return total + (quantidade * preco);
    }, 0);
  }

  // Função para processar dados extraídos do ficheiro .eml
  function processarDadosEml(dados: { nomeDespesa: string; produtos: Array<{ nome: string; quantidade: string; preco: string }> }) {
    // Preencher nome da despesa
    setNovaDespesa(prev => ({ ...prev, nome: dados.nomeDespesa }));
    
    // Preencher produtos
    setProdutos(dados.produtos.map(produto => ({
      nome: produto.nome,
      quantidade: produto.quantidade,
      preco: produto.preco
    })));
    
    toast.success(`Formulário preenchido com ${dados.produtos.length} produto(s) da Boticário!`);
  }

  // Ao abrir modais
  function handleAddOpen() {
    setNovaDespesa({ nome: '', valor: '', data: new Date().toISOString().split('T')[0] });
    setProdutos([{ nome: "", quantidade: "1", preco: "" }]);
    setAddModalOpen(true);
    setModalAberto(true);
  }
  function handleEditOpen(despesa: any) {
    setDespesaEdit({ ...despesa, data: despesa.data.slice(0, 10) });
    
    // Carregar produtos existentes ou criar um produto vazio
    if (despesa.produtos && despesa.produtos.length > 0) {
      setProdutosEdit(despesa.produtos.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        quantidade: p.quantidade.toString(),
        preco: p.preco.toString()
      })));
    } else {
      setProdutosEdit([{ nome: "", quantidade: "1", preco: "" }]);
    }
    
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
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Nome da despesa</th>
              <th className="px-4 py-2 text-left">Valor Total</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">A carregar...</td></tr>
            ) : despesasArray.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">Nenhuma despesa encontrada.</td></tr>
            ) : (
              despesasArray.map((despesa) => (
                <React.Fragment key={despesa.id}>
                  <tr 
                    className="border-t border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => setDespesaExpandida(despesaExpandida === despesa.id ? null : despesa.id)}
                  >
                    <td className="px-4 py-2 font-mono text-sm">#{despesa.id}</td>
                  <td className="px-4 py-2">{despesa.nome}</td>
                    <td className="px-4 py-2 font-bold">€{Number(despesa.valor).toFixed(2)}</td>
                  <td className="px-4 py-2">{despesa.data.slice(0, 10)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditOpen(despesa)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >Editar</button>
                    <button
                      onClick={() => handleDeleteOpen(despesa)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {/* Linha expandida com produtos */}
                  {despesaExpandida === despesa.id && despesa.produtos && despesa.produtos.length > 0 && (
                    <tr className="bg-gray-900">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-blue-400 mb-3">Produtos:</h4>
                          <div className="grid gap-2">
                            {despesa.produtos.map((produto: any, index: number) => (
                              <div key={produto.id} className="flex items-center justify-between bg-gray-800 rounded p-3">
                                <div className="flex items-center space-x-4">
                                  <span className="font-medium">{produto.nome}</span>
                                  <span className="text-gray-400">x{produto.quantidade}</span>
                                  <span className="text-green-400">€{produto.preco.toFixed(2)} cada</span>
                                </div>
                                <div className="font-bold">
                                  €{(produto.quantidade * produto.preco).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                  </td>
                </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Cards responsivos para mobile */}
      <div className="block md:hidden space-y-4">
        {despesasArray.length === 0 ? (
          <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhuma despesa encontrada.</div>
        ) : (
          despesasArray.map((despesa, idx) => (
            <div key={despesa.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl shadow-2xl max-w-[95vw] mx-auto overflow-hidden`}>
              {/* Cabeçalho clicável */}
              <div 
                className="p-5 cursor-pointer"
                onClick={() => setDespesaExpandida(despesaExpandida === despesa.id ? null : despesa.id)}
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-400">Despesa #</span>
                  <span className="font-mono text-sm text-blue-400">#{despesa.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-400">Nome</span>
                <span className="font-bold text-base text-white">{despesa.nome}</span>
              </div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-400">Valor Total</span>
                  <span className="font-bold text-lg text-green-400">€{Number(despesa.valor).toFixed(2)}</span>
              </div>
                <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-gray-400">Data</span>
                <span className="font-semibold">{despesa.data.slice(0, 10)}</span>
                </div>
                <div className="flex justify-center text-gray-400 text-sm">
                  <span>{despesaExpandida === despesa.id ? '▲ Ver menos' : '▼ Ver produtos'}</span>
                </div>
              </div>
              
              {/* Produtos expandidos */}
              {despesaExpandida === despesa.id && despesa.produtos && despesa.produtos.length > 0 && (
                <div className="border-t border-gray-700 p-4 bg-gray-900">
                  <h4 className="font-semibold text-blue-400 mb-3 text-sm">Produtos:</h4>
                  <div className="space-y-2">
                    {despesa.produtos.map((produto: any) => (
                      <div key={produto.id} className="bg-gray-800 rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{produto.nome}</span>
                          <span className="font-bold text-sm">€{(produto.quantidade * produto.preco).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Quantidade: {produto.quantidade}</span>
                          <span>€{produto.preco.toFixed(2)} cada</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="p-4 border-t border-gray-700 flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditOpen(despesa); }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow flex-1"
                >
                  Editar
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteOpen(despesa); }} 
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow flex-1"
                >
                  Eliminar
                </button>
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
            <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative pointer-events-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Adicionar Despesa</h2>
              <form onSubmit={handleAddSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nome da despesa</label>
                  <input 
                    name="nome" 
                    value={novaDespesa.nome} 
                    onChange={e => setNovaDespesa({ ...novaDespesa, nome: e.target.value })} 
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Data</label>
                  <input 
                    name="data" 
                    type="date" 
                    value={novaDespesa.data} 
                    onChange={e => setNovaDespesa({ ...novaDespesa, data: e.target.value })} 
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" 
                    required
                  />
                </div>

                {/* Upload de ficheiro .eml */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Importar da Boticário</h3>
                  <EmlUploader onDadosExtraidos={processarDadosEml} />
                </div>

                {/* Seção de Produtos */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-blue-400">Produtos</h3>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Valor Total:</div>
                      <div className="text-xl font-bold text-green-400">€{calcularValorTotal().toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {produtos.map((produto, index) => (
                      <div key={index} className="bg-gray-800 rounded p-4 border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-gray-300 mb-1 text-sm">Nome do Produto</label>
                            <input
                              type="text"
                              value={produto.nome}
                              onChange={(e) => atualizarProduto(index, 'nome', e.target.value)}
                              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                              placeholder="Ex: Revista, Livro..."
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 mb-1 text-sm">Quantidade</label>
                            <input
                              type="number"
                              min="1"
                              value={produto.quantidade}
                              onChange={(e) => atualizarProduto(index, 'quantidade', e.target.value)}
                              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                            />
                </div>
                <div>
                            <label className="block text-gray-300 mb-1 text-sm">Preço (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={produto.preco}
                              onChange={(e) => atualizarProduto(index, 'preco', e.target.value)}
                              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-sm text-gray-400">
                            Subtotal: €{((parseInt(produto.quantidade) || 0) * (parseFloat(produto.preco) || 0)).toFixed(2)}
                          </div>
                          {produtos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removerProduto(index)}
                              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={adicionarProduto}
                    className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                  >
                    + Acrescentar Produto
                  </button>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700">
                  <button type="button" onClick={handleAddModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Guardar Despesa</button>
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
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Editar Despesa</h2>
                <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Nome da despesa</label>
                    <input 
                      name="nome" 
                      value={despesaEdit.nome} 
                      onChange={e => setDespesaEdit({ ...despesaEdit, nome: e.target.value })} 
                      className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Data</label>
                    <input 
                      name="data" 
                      type="date" 
                      value={despesaEdit.data} 
                      onChange={e => setDespesaEdit({ ...despesaEdit, data: e.target.value })} 
                      className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" 
                      required
                    />
                  </div>

                  {/* Seção de Produtos */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-blue-400">Produtos</h3>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Valor Total:</div>
                        <div className="text-xl font-bold text-green-400">€{calcularValorTotalEdit().toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {produtosEdit.map((produto, index) => (
                        <div key={index} className="bg-gray-800 rounded p-4 border border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-gray-300 mb-1 text-sm">Nome do Produto</label>
                              <input
                                type="text"
                                value={produto.nome}
                                onChange={(e) => atualizarProdutoEdit(index, 'nome', e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                                placeholder="Ex: Revista, Livro..."
                              />
                            </div>
                            <div>
                              <label className="block text-gray-300 mb-1 text-sm">Quantidade</label>
                              <input
                                type="number"
                                min="1"
                                value={produto.quantidade}
                                onChange={(e) => atualizarProdutoEdit(index, 'quantidade', e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                              />
                  </div>
                  <div>
                              <label className="block text-gray-300 mb-1 text-sm">Preço (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={produto.preco}
                                onChange={(e) => atualizarProdutoEdit(index, 'preco', e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3">
                            <div className="text-sm text-gray-400">
                              Subtotal: €{((parseInt(produto.quantidade) || 0) * (parseFloat(produto.preco) || 0)).toFixed(2)}
                            </div>
                            {produtosEdit.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removerProdutoEdit(index)}
                                className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={adicionarProdutoEdit}
                      className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                    >
                      + Acrescentar Produto
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700">
                    <button type="button" onClick={handleEditModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Guardar Alterações</button>
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