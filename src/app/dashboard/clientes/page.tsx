'use client';
import React, { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { Transition } from '@headlessui/react';
import { useModalAberto } from '../../../components/ModalContext';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEdit, setClienteEdit] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    morada: '',
  });
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pendingToast, setPendingToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [clienteView, setClienteView] = useState<any>(null);
  const [compras, setCompras] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;
  const { setModalAberto } = useModalAberto();

  // Buscar clientes da API
  const fetchClientes = () => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => setClientes(data || []));
  };
  useEffect(() => {
    fetchClientes();
  }, []);

  // Toast após modal fechar
  useEffect(() => {
    if (pendingToast) {
      if (pendingToast.type === 'success') toast.success(pendingToast.message);
      else toast.error(pendingToast.message);
      setPendingToast(null);
    }
  }, [pendingToast]);

  function handleAddOpen() {
    setNovoCliente({ nome: '', email: '', telefone: '', morada: '' });
    setAddModalOpen(true);
    setModalAberto(true);
  }
  function handleAddChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNovoCliente({ ...novoCliente, [e.target.name]: e.target.value });
  }
  async function handleAddSave(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCliente.nome) {
      toast.error('O nome do cliente é obrigatório!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      });
      const data = await res.json();
      if (!res.ok) {
        setPendingToast({ type: 'error', message: data.error || 'Erro ao acrescentar cliente.' });
        setLoading(false);
        return;
      }
      setAddModalOpen(false);
      setPendingToast({ type: 'success', message: 'Cliente adicionado com sucesso!' });
      fetchClientes();
    } catch {
      setPendingToast({ type: 'error', message: 'Erro ao acrescentar cliente.' });
    } finally {
      setLoading(false);
    }
  }
  function handleAddModalClose() {
    setAddModalOpen(false);
    setModalAberto(false);
  }

  function handleEditOpen(cliente: any) {
    setClienteEdit({ ...cliente });
    setModalOpen(true);
    setModalAberto(true);
  }
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClienteEdit({ ...clienteEdit, [e.target.name]: e.target.value });
  }
  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteEdit.nome) {
      toast.error('O nome do cliente é obrigatório!');
      return;
    }
    // Encontrar cliente original
    const original = clientes.find(c => c.id === clienteEdit.id);
    if (
      original &&
      original.nome === clienteEdit.nome &&
      (original.email || '') === (clienteEdit.email || '') &&
      (original.telefone || '') === (clienteEdit.telefone || '') &&
      (original.morada || '') === (clienteEdit.morada || '')
    ) {
      setModalOpen(false); // Nada mudou, só fecha o modal
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clienteEdit.id,
          nome: clienteEdit.nome,
          email: clienteEdit.email,
          telefone: clienteEdit.telefone,
          morada: clienteEdit.morada,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPendingToast({ type: 'error', message: data.error || 'Erro ao editar cliente.' });
        setLoading(false);
        return;
      }
      setModalOpen(false);
      setPendingToast({ type: 'success', message: 'Cliente editado com sucesso!' });
      fetchClientes();
    } catch {
      setPendingToast({ type: 'error', message: 'Erro ao editar cliente.' });
    } finally {
      setLoading(false);
    }
  }
  function handleModalClose() {
    setModalOpen(false);
    setModalAberto(false);
  }

  function handleDelete(clienteId: number) {
    setConfirmDeleteId(clienteId);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDeleteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao eliminar cliente.');
        setLoading(false);
        setConfirmDeleteId(null);
        return;
      }
      toast.success('Cliente eliminado com sucesso!');
      fetchClientes();
    } catch {
      toast.error('Erro ao eliminar cliente.');
    } finally {
      setLoading(false);
      setConfirmDeleteId(null);
    }
  }

  async function handleViewCliente(cliente: any) {
    setClienteView(cliente);
    setShowViewModal(true);
    setModalAberto(true);
    try {
      const res = await fetch('/api/vendas?all=true');
      const data = await res.json();
      console.log('Dados da API vendas:', data);
      console.log('Cliente ID:', cliente.id);
      // Garante que cada venda do cliente aparece como uma linha, mesmo com múltiplos produtos
      const vendasDoCliente = (data.vendas || []).filter((v: any) => v.cliente?.id === cliente.id);
      console.log('Vendas do cliente:', vendasDoCliente);
      setCompras(vendasDoCliente);
    } catch {
      setCompras([]);
    }
  }

  function handlePrint(cliente: any) {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.text('Oribeti - Fatura Eletrônica', 14, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${dataAtual}`, 14, 30);
    doc.text(`Cliente: ${cliente.nome}`, 14, 40);
    doc.text(`Email: ${cliente.email || '-'}`, 14, 48);
    doc.text(`Telefone: ${cliente.telefone || '-'}`, 14, 56);
    doc.text(`Morada: ${cliente.morada || '-'}`, 14, 64);
    // Produtos adquiridos (busca compras do cliente)
    if (compras.length > 0) {
      doc.text('Produtos adquiridos:', 14, 74);
      let y = 82;
      compras.forEach((v: any, idx: number) => {
        doc.text(`${idx + 1}. Produto: ${v.nomeProduto}`, 16, y);
        doc.text(`   Valor: €${v.valorFinal.toFixed(2)}`, 16, y + 8);
        y += 16;
      });
    } else {
      doc.text('Nenhum produto adquirido.', 14, 74);
    }
    doc.save(`fatura_${cliente.nome.replace(/\s+/g, '_')}_${dataAtual}.pdf`);
  }

  const filteredClientes = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredClientes.length / pageSize);
  const paginatedClientes = filteredClientes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage(1); }, [search]);

  function handleViewModalClose() {
    setShowViewModal(false);
    setModalAberto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <input
            type="text"
            placeholder="Procurar cliente..."
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring focus:border-green-500 transition-all duration-300 hover:border-green-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={handleAddOpen} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg">Acrescentar cliente</button>
        </div>
      </div>
      {/* Tabela tradicional para desktop */}
      <div className="overflow-x-auto rounded-lg shadow scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        <table className="w-full table-auto bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left whitespace-nowrap">Nome</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Email</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Telefone</th>
              <th className="px-2 py-2 text-left whitespace-nowrap hidden sm:table-cell">Morada</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-4">Nenhum cliente registado.</td>
              </tr>
            ) :
              paginatedClientes.map(cliente => (
                <tr key={cliente.id} className="border-t border-gray-700">
                  <td className="px-2 py-2 break-words max-w-[120px] sm:max-w-[180px] align-middle">{cliente.nome}</td>
                  <td className="px-2 py-2 break-words max-w-[120px] sm:max-w-[180px] align-middle">{cliente.email}</td>
                  <td className="px-2 py-2 break-words max-w-[100px] align-middle">{cliente.telefone}</td>
                  <td className="px-2 py-2 break-words max-w-[120px] align-middle hidden sm:table-cell">{cliente.morada}</td>
                  <td className="px-2 py-2 align-middle">
                    <div className="flex flex-col md:flex-row gap-2 w-max">
                      <button onClick={() => handleEditOpen(cliente)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105">Editar</button>
                      <button onClick={() => handleDelete(cliente.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105">Eliminar</button>
                      <button onClick={() => handleViewCliente(cliente)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105">Ver cliente</button>
                      <button onClick={() => handlePrint(cliente)} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105">Imprimir</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {/* Cards responsivos para mobile */}
      <div className="block md:hidden space-y-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        {paginatedClientes.length === 0 ? (
          <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum cliente registado.</div>
        ) : (
          paginatedClientes.map((cliente, idx) => (
            <div key={cliente.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto animate-fade-in-up transition-all duration-300 hover:scale-102`} style={{animationDelay: `${0.1 * idx}s`}}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Nome</span>
                <span className="font-bold text-base text-white">{cliente.nome}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Email</span>
                <span className="font-semibold">{cliente.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Telefone</span>
                <span className="font-semibold">{cliente.telefone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Morada</span>
                <span className="font-semibold">{cliente.morada}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleEditOpen(cliente)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow transition-all duration-200 hover:scale-105">Editar</button>
                <button onClick={() => handleDelete(cliente.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow transition-all duration-200 hover:scale-105">Eliminar</button>
                <button onClick={() => handleViewCliente(cliente)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow transition-all duration-200 hover:scale-105">Ver cliente</button>
                <button onClick={() => handlePrint(cliente)} className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow transition-all duration-200 hover:scale-105">Imprimir</button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Paginação moderna centralizada */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50 pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >«</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded text-sm pagination-btn ${p === currentPage ? 'bg-green-600 text-white font-bold' : 'bg-gray-700 text-white'}`}
              onClick={() => setCurrentPage(p)}
            >{p}</button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-50 pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >»</button>
        </div>
      )}
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
            <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Acrescentar Cliente</h2>
              <form onSubmit={handleAddSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nome</label>
                  <input name="nome" value={novoCliente.nome} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Email</label>
                  <input name="email" value={novoCliente.email} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Telefone</label>
                  <input name="telefone" value={novoCliente.telefone} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Morada</label>
                  <input name="morada" value={novoCliente.morada} onChange={handleAddChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={handleAddModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium" disabled={loading}>{loading ? 'A guardar...' : 'Guardar'}</button>
                </div>
              </form>
              <button onClick={handleAddModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
            </div>
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de edição (mock) */}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleModalClose} />
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
            {clienteEdit ? (
              <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Editar Cliente</h2>
                <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Nome</label>
                    <input name="nome" value={clienteEdit.nome} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Email</label>
                    <input name="email" value={clienteEdit.email} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Telefone</label>
                    <input name="telefone" value={clienteEdit.telefone} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Morada</label>
                    <input name="morada" value={clienteEdit.morada} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={handleModalClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium">Salvar</button>
                  </div>
                </form>
                <button onClick={handleModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de confirmação de exclusão */}
      <Transition.Root show={confirmDeleteId !== null} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setConfirmDeleteId(null)} />
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
              <h2 className="text-xl font-bold text-white mb-4">Eliminar Cliente</h2>
              <p className="text-gray-300 mb-6">Tem certeza que deseja eliminar este cliente? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium" disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
              </div>
            </div>
          </div>
        </Transition.Child>
      </Transition.Root>
      {/* Modal de Ver Cliente */}
      <Transition.Root show={showViewModal && !!clienteView} as={Fragment}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={handleViewModalClose} />
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
            {clienteView ? (
              <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-2xl relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Detalhes do Cliente</h2>
                <div className="mb-4">
                  <div className="text-lg font-semibold text-white">{clienteView.nome}</div>
                  <div className="text-gray-300 text-sm">Email: {clienteView.email || '-'}</div>
                  <div className="text-gray-300 text-sm">Telefone: {clienteView.telefone || '-'}</div>
                  <div className="text-gray-300 text-sm">Morada: {clienteView.morada || '-'}</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 mt-4">Compras</h3>
                <div className="overflow-x-auto rounded-lg shadow mb-2 scrollbar-custom max-h-[40vh] md:max-h-96">
                  <table className="min-w-full bg-gray-800 text-white">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Data</th>
                        <th className="px-4 py-2 text-left">Produto</th>
                        <th className="px-4 py-2 text-left">Valor Revista (€)</th>
                        <th className="px-4 py-2 text-left">Valor Final (€)</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.length === 0 ? (
                        <tr>
                          <td className="px-4 py-2 text-gray-400" colSpan={5}>Nenhuma compra encontrada.</td>
                        </tr>
                      ) : (
                        compras.map((v: any, idx: number) => {
                          // Se v.produtos existir, é uma venda com múltiplos produtos
                          const produtos = v.produtos ? v.produtos.map((p: any) => p.nomeProduto).join(', ') : v.nomeProduto;
                          const valorRevista = v.produtos ? v.produtos.reduce((acc: number, p: any) => acc + (p.valorRevista * p.quantidade), 0) : v.valorRevista;
                          const valorFinal = v.produtos ? v.produtos.reduce((acc: number, p: any) => acc + (p.valorFinal * p.quantidade), 0) : v.valorFinal;
                          const status = v.status === 'PAGO' || v.status === 'Pago' ? 'Pago' : 'Pendente';
                          return (
                          <tr key={v.id || idx} className="border-t border-gray-700">
                            <td className="px-4 py-2">{new Date(v.data).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{produtos}</td>
                              <td className="px-4 py-2">€{valorRevista?.toFixed(2)}</td>
                              <td className="px-4 py-2">€{valorFinal?.toFixed(2)}</td>
                              <td className="px-4 py-2">
                                <span className={`font-bold px-2 py-1 rounded ${status === 'Pago' ? 'bg-green-700 text-white' : 'bg-yellow-500 text-white'}`}>{status}</span>
                              </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleViewModalClose} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Fechar</button>
                </div>
              </div>
            ) : null}
          </div>
        </Transition.Child>
      </Transition.Root>
    </div>
  );
} 