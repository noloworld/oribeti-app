'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

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
        setPendingToast({ type: 'error', message: data.error || 'Erro ao adicionar cliente.' });
        setLoading(false);
        return;
      }
      setAddModalOpen(false);
      setPendingToast({ type: 'success', message: 'Cliente adicionado com sucesso!' });
      fetchClientes();
    } catch {
      setPendingToast({ type: 'error', message: 'Erro ao adicionar cliente.' });
    } finally {
      setLoading(false);
    }
  }
  function handleAddModalClose() {
    setAddModalOpen(false);
  }

  function handleEditOpen(cliente: any) {
    setClienteEdit({ ...cliente });
    setModalOpen(true);
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
    try {
      const res = await fetch('/api/vendas');
      const data = await res.json();
      setCompras((data || []).filter((v: any) => v.cliente?.id === cliente.id));
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Procurar cliente..."
            className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring focus:border-green-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={handleAddOpen} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium">Adicionar cliente</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
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
            {clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-4">Nenhum cliente registado.</td>
              </tr>
            ) : (
              clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())).map(cliente => (
                <tr key={cliente.id} className="border-t border-gray-700">
                  <td className="px-2 py-2 break-words max-w-[120px] sm:max-w-[180px] align-middle">{cliente.nome}</td>
                  <td className="px-2 py-2 break-words max-w-[120px] sm:max-w-[180px] align-middle">{cliente.email}</td>
                  <td className="px-2 py-2 break-words max-w-[100px] align-middle">{cliente.telefone}</td>
                  <td className="px-2 py-2 break-words max-w-[120px] align-middle hidden sm:table-cell">{cliente.morada}</td>
                  <td className="px-2 py-2 align-middle">
                    <div className="flex flex-col md:flex-row gap-2 w-max">
                      <button onClick={() => handleEditOpen(cliente)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Editar</button>
                      <button onClick={() => handleDelete(cliente.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Eliminar</button>
                      <button onClick={() => handleViewCliente(cliente)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">Ver cliente</button>
                      <button onClick={() => handlePrint(cliente)} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm">Imprimir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de adição */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleAddModalClose}>
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Adicionar Cliente</h2>
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
                <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
            <button onClick={handleAddModalClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">×</button>
          </div>
        </div>
      )}
      {/* Modal de edição (mock) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleModalClose}>
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
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
        </div>
      )}
      {/* Modal de confirmação de exclusão */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-white mb-4">Eliminar Cliente</h2>
            <p className="text-gray-300 mb-6">Tem certeza que deseja eliminar este cliente? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium" disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Ver Cliente */}
      {showViewModal && clienteView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowViewModal(false)}>
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Detalhes do Cliente</h2>
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{clienteView.nome}</div>
              <div className="text-gray-300 text-sm">Email: {clienteView.email || '-'}</div>
              <div className="text-gray-300 text-sm">Telefone: {clienteView.telefone || '-'}</div>
              <div className="text-gray-300 text-sm">Morada: {clienteView.morada || '-'}</div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 mt-4">Compras</h3>
            <div className="overflow-x-auto rounded-lg shadow mb-2">
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
                    compras.map((v, idx) => (
                      <tr key={v.id || idx} className="border-t border-gray-700">
                        <td className="px-4 py-2">{new Date(v.data).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{v.nomeProduto}</td>
                        <td className="px-4 py-2">€{v.valorRevista.toFixed(2)}</td>
                        <td className="px-4 py-2">€{v.valorFinal.toFixed(2)}</td>
                        <td className="px-4 py-2">{v.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 