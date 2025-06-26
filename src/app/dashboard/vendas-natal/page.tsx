'use client';
import React, { useState } from 'react';
import { FaEuroSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useModalAberto } from '../../../components/ModalContext';

const vendasExemplo = [
  {
    id: 1,
    cliente: 'Paula Souza',
    produto: 'Kit Natal',
    valorVenda: '35',
    data: '2023-12-15',
  },
  {
    id: 2,
    cliente: 'Carlos Lima',
    produto: 'Perfume Natal',
    valorVenda: '28',
    data: '2023-12-18',
  },
];

export default function VendasNatalPage() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [modalOpen, setModalOpen] = useState(false);
  const [vendaEdit, setVendaEdit] = useState<any>(null);
  const [vendas, setVendas] = useState(vendasExemplo);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [novaVenda, setNovaVenda] = useState({
    cliente: '',
    produto: '',
    valorVenda: '',
    data: '',
  });
  const { setModalAberto } = useModalAberto();
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  function handleAddOpen() {
    setNovaVenda({ cliente: '', produto: '', valorVenda: '', data: new Date().toISOString().split('T')[0] });
    setAddModalOpen(true);
    setModalAberto(true);
  }
  function handleAddChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNovaVenda({ ...novaVenda, [e.target.name]: e.target.value });
  }
  function handleAddSave(e: React.FormEvent) {
    e.preventDefault();
    const novoId = vendas.length ? Math.max(...vendas.map(v => v.id)) + 1 : 1;
    setVendas([...vendas, { ...novaVenda, id: novoId }]);
    toast.success('Venda de Natal adicionada com sucesso!');
    setAddModalOpen(false);
    setModalAberto(false);
  }
  function handleAddModalClose() {
    setAddModalOpen(false);
    setModalAberto(false);
  }

  function handleEditOpen(venda: any) {
    setVendaEdit({ ...venda });
    setModalOpen(true);
    setModalAberto(true);
  }
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVendaEdit({ ...vendaEdit, [e.target.name]: e.target.value });
  }
  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    setVendas(vendas.map(v => v.id === vendaEdit.id ? vendaEdit : v));
    toast.success('Venda de Natal editada com sucesso!');
    setModalOpen(false);
    setModalAberto(false);
  }
  function handleModalClose() {
    setModalOpen(false);
    setModalAberto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Vendas de Natal</h1>
        <button onClick={handleAddOpen} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium">Adicionar venda</button>
      </div>
      {/* Tabela tradicional para desktop */}
      <div className="overflow-x-auto rounded-lg shadow scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block">
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Produto</th>
              <th className="px-4 py-2 text-left">Valor da venda</th>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map(venda => (
              <tr key={venda.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{venda.cliente}</td>
                <td className="px-4 py-2">{venda.produto}</td>
                <td className="px-4 py-2">€{venda.valorVenda}</td>
                <td className="px-4 py-2">{venda.data}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleEditOpen(venda)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Cards responsivos para mobile */}
      <div className="block md:hidden space-y-8">
        {vendas.length === 0 ? (
          <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhuma venda encontrada.</div>
        ) : (
          vendas.map((venda, idx) => (
            <div key={venda.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Cliente</span>
                <span className="font-bold text-base text-white">{venda.cliente}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Produto</span>
                <span className="font-semibold">{venda.produto}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Valor da venda</span>
                <span className="font-semibold">€{venda.valorVenda}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Data</span>
                <span className="font-semibold">{venda.data}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleEditOpen(venda)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow">Editar</button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal de adição */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleAddModalClose}>
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Adicionar Venda de Natal</h2>
            <form onSubmit={handleAddSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Cliente</label>
                <input name="cliente" value={novaVenda.cliente} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Produto</label>
                <input name="produto" value={novaVenda.produto} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Valor da venda</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaEuroSign /></span>
                  <input name="valorVenda" value={novaVenda.valorVenda} onChange={handleAddChange} className="w-full pl-8 pr-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Data</label>
                <input name="data" type="date" value={novaVenda.data} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={handleAddModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
              </div>
            </form>
            <button onClick={handleAddModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
          </div>
        </div>
      )}
      {/* Modal de edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleModalClose}>
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Editar Venda de Natal</h2>
            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Cliente</label>
                <input name="cliente" value={vendaEdit.cliente} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Produto</label>
                <input name="produto" value={vendaEdit.produto} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Valor da venda</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaEuroSign /></span>
                  <input name="valorVenda" value={vendaEdit.valorVenda} onChange={handleEditChange} className="w-full pl-8 pr-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Data</label>
                <input name="data" type="date" value={vendaEdit.data} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={handleModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
              </div>
            </form>
            <button onClick={handleModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
          </div>
        </div>
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