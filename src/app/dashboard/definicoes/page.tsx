'use client';
import React, { useState, useEffect } from 'react';
import { FaUserEdit, FaUserPlus, FaTrash, FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';

const usuariosExemplo = [
  { id: 1, nome: 'Administrador', email: 'admin@email.com', tipo: 'Administrador' },
  { id: 2, nome: 'Revendedor 1', email: 'revendedor1@email.com', tipo: 'Revendedor' },
];

interface Log {
  id: number;
  userId: number;
  userEmail: string;
  acao: string;
  detalhes: string | null;
  data: string;
}

export default function DefinicoesPage() {
  const [usuarios, setUsuarios] = useState(usuariosExemplo);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', tipo: 'Revendedor' });
  const [carregando, setCarregando] = useState(false);
  const [meuUsuario, setMeuUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({ nome: '', email: '', senha: '' });
  
  // Estados para logs
  const [logs, setLogs] = useState<Log[]>([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);
  const [paginaLogs, setPaginaLogs] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [mostrarLogs, setMostrarLogs] = useState(false);

  useEffect(() => {
    async function fetchUsuarios() {
      setCarregando(true);
      try {
        const res = await fetch('/api/usuarios');
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        const data = await res.json();
        setUsuarios(data);
      } catch (err) {
        toast.error('Erro ao buscar usuários');
      } finally {
        setCarregando(false);
      }
    }
    fetchUsuarios();
  }, []);

  useEffect(() => {
    async function fetchMeuUsuario() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Erro ao buscar usuário logado');
        const data = await res.json();
        setMeuUsuario(data);
        setFormEdit({ nome: data.nome, email: data.email, senha: '' });
      } catch (err) {
        toast.error('Erro ao buscar usuário logado');
      }
    }
    fetchMeuUsuario();
  }, []);

  // Função para buscar logs
  async function fetchLogs(pagina: number = 1) {
    if (!meuUsuario || meuUsuario.tipo !== 'ADMIN') return;
    
    setCarregandoLogs(true);
    try {
      const res = await fetch(`/api/logs?page=${pagina}&limit=20`);
      if (!res.ok) throw new Error('Erro ao buscar logs');
      const data = await res.json();
      setLogs(data.logs);
      setTotalLogs(data.total);
      setPaginaLogs(pagina);
    } catch (err) {
      toast.error('Erro ao buscar logs de atividades');
    } finally {
      setCarregandoLogs(false);
    }
  }

  // Função para alternar visibilidade dos logs
  function toggleLogs() {
    if (!mostrarLogs) {
      fetchLogs(1);
    }
    setMostrarLogs(!mostrarLogs);
  }

  // Função para formatar data
  function formatarData(dataString: string) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNovoUsuario({ ...novoUsuario, [e.target.name]: e.target.value });
  }
  async function handleAddUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
      toast.error('Preencha todos os campos');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao adicionar usuário');
        return;
      }
      setUsuarios([data, ...usuarios]);
      setNovoUsuario({ nome: '', email: '', senha: '', tipo: 'Revendedor' });
      toast.success('Usuário adicionado com sucesso!');
    } catch (err) {
      toast.error('Erro ao adicionar usuário');
    } finally {
      setCarregando(false);
    }
  }
  async function handleRemoverUsuario(id: number) {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    setCarregando(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao remover usuário');
        return;
      }
      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success('Usuário removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover usuário');
    } finally {
      setCarregando(false);
    }
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormEdit({ ...formEdit, [e.target.name]: e.target.value });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formEdit.nome || !formEdit.email) {
      toast.error('Preencha nome e email');
      return;
    }
    setEditando(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meuUsuario.id,
          nome: formEdit.nome,
          email: formEdit.email,
          senha: formEdit.senha || undefined,
          tipo: meuUsuario.tipo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao editar conta');
        return;
      }
      setMeuUsuario(data);
      setFormEdit({ nome: data.nome, email: data.email, senha: '' });
      toast.success('Conta atualizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao editar conta');
    } finally {
      setEditando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold mb-2">Definições</h1>
      
      {/* Seção de Logs para Administradores */}
      {meuUsuario?.tipo === 'ADMIN' && (
        <section className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaHistory className="text-lg text-purple-400" />
              <span className="font-semibold">Logs de Atividades</span>
            </div>
            <button
              onClick={toggleLogs}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium"
            >
              {mostrarLogs ? 'Ocultar Logs' : 'Ver Logs'}
            </button>
          </div>
          
          {mostrarLogs && (
            <div className="space-y-4">
              {carregandoLogs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">A carregar logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-gray-400 text-center py-8 bg-gray-900 rounded-lg">
                  Nenhum log de atividade encontrado.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-3 py-3 text-left">Data/Hora</th>
                          <th className="px-3 py-3 text-left">Utilizador</th>
                          <th className="px-3 py-3 text-left">Ação</th>
                          <th className="px-3 py-3 text-left">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="px-3 py-3 text-xs text-gray-300">
                              {formatarData(log.data)}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {log.userEmail}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium">
                              {log.acao}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-300 max-w-md truncate">
                              {log.detalhes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block md:hidden space-y-3">
                    {logs.map((log, idx) => (
                      <div key={log.id} className={`bg-gray-${idx % 2 === 0 ? '900' : '800'} rounded-xl p-4 shadow-lg`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-400">{formatarData(log.data)}</span>
                          <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">{log.acao}</span>
                        </div>
                        <div className="text-sm font-medium mb-1">{log.userEmail}</div>
                        <div className="text-sm text-gray-300">{log.detalhes}</div>
                      </div>
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalLogs > 20 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => fetchLogs(paginaLogs - 1)}
                        disabled={paginaLogs <= 1}
                        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        ← Anterior
                      </button>
                      <span className="text-sm text-gray-300">
                        Página {paginaLogs} de {Math.ceil(totalLogs / 20)}
                      </span>
                      <button
                        onClick={() => fetchLogs(paginaLogs + 1)}
                        disabled={paginaLogs >= Math.ceil(totalLogs / 20)}
                        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Seguinte →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col md:flex-row gap-8 justify-center items-start w-full">
        <section className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 w-full md:w-1/2 max-w-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaUserEdit className="text-lg text-blue-400" />
            <span className="font-semibold">Editar minha conta</span>
          </div>
          <form onSubmit={handleEditSave} className="flex flex-col gap-3">
            <input
              type="text"
              name="nome"
              value={formEdit.nome}
              onChange={handleEditChange}
              placeholder="Nome"
              className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none"
              disabled={editando}
            />
            <input
              type="email"
              name="email"
              value={formEdit.email}
              onChange={handleEditChange}
              placeholder="Email"
              className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none"
              disabled={editando}
            />
            <input
              type="password"
              name="senha"
              value={formEdit.senha}
              onChange={handleEditChange}
              placeholder="Nova senha (opcional)"
              className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none"
              disabled={editando}
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium mt-2"
              disabled={editando}
            >
              {editando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </section>
        {meuUsuario?.tipo === 'ADMIN' && (
          <section className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 w-full md:w-1/2 max-w-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaUserPlus className="text-lg text-green-400" />
              <span className="font-semibold">Gerenciar usuários/revendedores</span>
            </div>
            <form onSubmit={handleAddUsuario} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-x-2 mb-4 w-full flex-wrap">
              <input
                name="nome"
                value={novoUsuario.nome}
                onChange={handleAddChange}
                placeholder="Nome"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                required
                disabled={carregando}
              />
              <input
                name="email"
                value={novoUsuario.email}
                onChange={handleAddChange}
                placeholder="Email"
                type="email"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                required
                disabled={carregando}
              />
              <input
                name="senha"
                value={novoUsuario.senha}
                onChange={handleAddChange}
                placeholder="Senha"
                type="password"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                required
                disabled={carregando}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-auto min-w-[110px]" disabled={carregando}>
                {carregando ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
            <div className="overflow-x-auto scrollbar-custom max-h-[40vh] md:max-h-96 hidden md:block">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Nome</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Email</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Tipo</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id} className="border-t border-gray-700">
                      <td className="px-2 py-2 break-words max-w-[100px] align-middle">{usuario.nome}</td>
                      <td className="px-2 py-2 break-words max-w-[140px] align-middle">{usuario.email}</td>
                      <td className="px-2 py-2 align-middle">{usuario.tipo}</td>
                      <td className="px-2 py-2 align-middle">
                        <button onClick={() => handleRemoverUsuario(usuario.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="block md:hidden space-y-8">
              {usuarios.length === 0 ? (
                <div className="text-gray-400 text-center py-3 bg-gray-800 rounded-lg text-sm">Nenhum usuário encontrado.</div>
              ) : (
                usuarios.map((usuario, idx) => (
                  <div key={usuario.id} className={`bg-gray-${idx % 2 === 0 ? '800' : '900'} rounded-xl p-5 shadow-2xl flex flex-col gap-3 max-w-[95vw] mx-auto`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Nome</span>
                      <span className="font-bold text-base text-white">{usuario.nome}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Email</span>
                      <span className="font-semibold">{usuario.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Tipo</span>
                      <span className="font-semibold">{usuario.tipo}</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => handleRemoverUsuario(usuario.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs min-w-[70px] shadow">Remover</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 