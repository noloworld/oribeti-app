'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaUsers, FaClock } from 'react-icons/fa';

interface Mensagem {
  id: number;
  userId: number;
  mensagem: string;
  criadoEm: string;
  lida: boolean;
  user: {
    id: number;
    nome: string;
    tipo: string;
  };
}

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    fetchMensagens();
    // Polling para atualizar mensagens a cada 3 segundos
    const interval = setInterval(fetchMensagens, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMensagens() {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMensagens(data.mensagens || []);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || enviando) return;

    setEnviando(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: novaMensagem }),
      });

      if (res.ok) {
        setNovaMensagem('');
        fetchMensagens(); // Atualizar mensagens imediatamente
      } else {
        alert('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  }

  function formatarData(data: string) {
    const date = new Date(data);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (date.toDateString() === hoje.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === ontem.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  function getInitials(nome: string) {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  function getAvatarColor(userId: number) {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
      'bg-red-500', 'bg-teal-500'
    ];
    return colors[userId % colors.length];
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 rounded-full p-2">
            <FaComments className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Chat da Equipa</h1>
            <p className="text-sm text-gray-400">Comunicação interna</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2">Carregando mensagens...</span>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaComments className="text-6xl mb-4 opacity-50" />
            <p className="text-lg">Nenhuma mensagem ainda</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          mensagens.map((mensagem) => (
            <div key={mensagem.id} className="flex gap-3">
              {/* Avatar */}
              <div className={`${getAvatarColor(mensagem.userId)} rounded-full w-10 h-10 flex items-center justify-center font-bold text-white flex-shrink-0`}>
                {getInitials(mensagem.user.nome)}
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{mensagem.user.nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    mensagem.user.tipo === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {mensagem.user.tipo === 'ADMIN' ? 'Admin' : 'Revendedor'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FaClock className="text-xs" />
                    {formatarData(mensagem.criadoEm)}
                  </span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 break-words">
                  <p className="text-gray-100">{mensagem.mensagem}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
            disabled={enviando}
          />
          <button
            onClick={enviarMensagem}
            disabled={enviando || !novaMensagem.trim()}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              enviando || !novaMensagem.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {enviando ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FaPaperPlane />
            )}
            <span className="hidden sm:inline">
              {enviando ? 'Enviando...' : 'Enviar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 