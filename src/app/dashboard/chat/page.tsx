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

interface UsuarioEscrevendo {
  id: number;
  nome: string;
  tipo: string;
}

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usuariosEscrevendo, setUsuariosEscrevendo] = useState<UsuarioEscrevendo[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, usuariosEscrevendo]);

  useEffect(() => {
    fetchMensagens();
    // Polling para atualizar mensagens a cada 3 segundos
    const interval = setInterval(fetchMensagens, 3000);
    return () => {
      clearInterval(interval);
      // Limpar typing status ao sair
      if (isTyping) {
        updateTypingStatus(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping]);

  async function fetchMensagens() {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMensagens(data.mensagens || []);
        setUsuariosEscrevendo(data.usuariosEscrevendo || []);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTypingStatus(typing: boolean) {
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping: typing }),
      });
      setIsTyping(typing);
    } catch (error) {
      console.error('Erro ao atualizar typing status:', error);
    }
  }

  function handleInputChange(value: string) {
    setNovaMensagem(value);
    
    // Se começou a escrever
    if (value.trim() && !isTyping) {
      updateTypingStatus(true);
    }
    
    // Reset do timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Se tem conteúdo, configurar timeout para parar de escrever
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 3000); // Parar após 3 segundos sem digitar
    } else {
      // Se campo vazio, parar imediatamente
      updateTypingStatus(false);
    }
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || enviando) return;

    setEnviando(true);
    const mensagemTexto = novaMensagem;
    setNovaMensagem(''); // Limpar imediatamente para melhor UX
    
    // Parar typing status imediatamente
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(false);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: mensagemTexto }),
      });

      if (res.ok) {
        // Buscar mensagens imediatamente após enviar
        await fetchMensagens();
      } else {
        alert('Erro ao enviar mensagem');
        setNovaMensagem(mensagemTexto); // Restaurar mensagem em caso de erro
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
      setNovaMensagem(mensagemTexto); // Restaurar mensagem em caso de erro
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
            <span className="ml-2">A carregar mensagens...</span>
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
        
        {/* Typing Indicators */}
        {usuariosEscrevendo.length > 0 && (
          <div className="flex gap-3 opacity-70">
            <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white flex-shrink-0">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-300 text-sm italic">
                  {usuariosEscrevendo.length === 1 
                    ? `${usuariosEscrevendo[0].nome} está escrevendo...`
                    : usuariosEscrevendo.length === 2
                    ? `${usuariosEscrevendo[0].nome} e ${usuariosEscrevendo[1].nome} estão escrevendo...`
                    : `${usuariosEscrevendo[0].nome} e mais ${usuariosEscrevendo.length - 1} pessoas estão escrevendo...`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={novaMensagem}
            onChange={(e) => handleInputChange(e.target.value)}
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