'use client';
import React, { useState, useEffect } from 'react';
import { FaUserEdit, FaUserPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const usuariosExemplo = [
  { id: 1, nome: 'Administrador', email: 'admin@email.com', tipo: 'Administrador' },
  { id: 2, nome: 'Revendedor 1', email: 'revendedor1@email.com', tipo: 'Revendedor' },
];

export default function DefinicoesPage() {
  const [usuarios, setUsuarios] = useState(usuariosExemplo);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', tipo: 'Revendedor' });
  const [carregando, setCarregando] = useState(false);
  const [meuUsuario, setMeuUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({ nome: '', email: '', senha: '' });

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
        const res = await fetch('/api/usuarios');
        if (!res.ok) throw new Error('Erro ao buscar usuário');
        const data = await res.json();
        if (data && data.length > 0) {
          setMeuUsuario(data[0]);
          setFormEdit({ nome: data[0].nome, email: data[0].email, senha: '' });
        }
      } catch (err) {
        toast.error('Erro ao buscar usuário logado');
      }
    }
    fetchMeuUsuario();
  }, []);

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
          <div className="overflow-x-auto">
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
        </section>
      </div>
    </div>
  );
} 