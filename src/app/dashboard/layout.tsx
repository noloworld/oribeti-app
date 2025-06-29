'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaChartPie, FaShoppingCart, FaGift, FaUsers, FaExclamationTriangle, FaMoneyBillWave, FaCog, FaBars, FaTimes, FaUserCircle, FaHome, FaComments, FaBell } from 'react-icons/fa';
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import { ModalProvider, useModalAberto } from '../../components/ModalContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </ModalProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutMsg, setLogoutMsg] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<{ nome: string; tipo: string } | null>(null);
  const [numDevedores, setNumDevedores] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [showOnline, setShowOnline] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const { modalAberto } = useModalAberto();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        setUserInfo({ nome: data.nome, tipo: data.tipo });
      } catch {}
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchDevedores() {
      try {
        const res = await fetch('/api/vendas');
        if (!res.ok) return;
        const data = await res.json();
        setNumDevedores((data || []).filter((v: any) => v.status === 'PENDENTE').length);
      } catch {}
    }
    fetchDevedores();
    // Escuta evento customizado para atualizar badge
    function handleDevedoresUpdate() {
      fetchDevedores();
    }
    window.addEventListener('devedoresUpdate', handleDevedoresUpdate);
    return () => {
      window.removeEventListener('devedoresUpdate', handleDevedoresUpdate);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    async function fetchOnline() {
      try {
        const res = await fetch('/api/usuarios?online=1');
        if (!res.ok) return;
        const data = await res.json();
        setOnlineUsers(data);
      } catch {}
    }
    fetchOnline();
    interval = setInterval(fetchOnline, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNotificacoes() {
      try {
        const res = await fetch('/api/notificacoes');
        if (!res.ok) return;
        const data = await res.json();
        setNotificacoes(data.notificacoes || []);
        setTotalNaoLidas(data.totalNaoLidas || 0);
      } catch {}
    }
    
    async function verificarVendasAntigas() {
      try {
        await fetch('/api/notificacoes/verificar-vendas-antigas', { method: 'POST' });
      } catch {}
    }

    fetchNotificacoes();
    verificarVendasAntigas(); // Verificar na inicialização
    
    // Polling para atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotificacoes, 30000);
    // Verificar vendas antigas a cada 2 horas
    const intervalVendas = setInterval(verificarVendasAntigas, 2 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(intervalVendas);
    };
  }, []);

  async function handleLogout() {
    setLogoutMsg('Logout realizado com sucesso!');
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setTimeout(() => {
      router.push('/login');
    }, 1200);
  }

  async function marcarTodasNotificacoesLidas() {
    try {
      const res = await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcarTodasLidas: true })
      });
      if (res.ok) {
        setTotalNaoLidas(0);
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      }
    } catch {}
  }

  function formatarDataNotificacao(data: string) {
    const date = new Date(data);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) return 'agora';
    if (diffMinutos < 60) return `${diffMinutos}min`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    return date.toLocaleDateString('pt-PT');
  }

  const menuItems = [
    { href: '/dashboard', label: 'Resumo Geral', icon: <FaHome className="text-lg mr-2" /> },
    { href: '/dashboard/vendas', label: 'Registo Vendas', icon: <FaShoppingCart className="text-lg mr-2" /> },
    { href: '/dashboard/clientes', label: 'Clientes', icon: <FaUsers className="text-lg mr-2" /> },
    { href: '/dashboard/devedores', label: 'Devedores', icon: <FaExclamationTriangle className="text-lg mr-2" /> },
    { href: '/dashboard/despesas', label: 'Despesas', icon: <FaMoneyBillWave className="text-lg mr-2" /> },
    { href: '/dashboard/sorteios', label: 'Sorteios', icon: <FaGift className="text-lg mr-2" /> },
    { href: '/dashboard/chat', label: 'Chat', icon: <FaComments className="text-lg mr-2" /> },
    { href: '/dashboard/definicoes', label: 'Definições', icon: <FaCog className="text-lg mr-2" /> },
  ];

  function normalizePath(path: string) {
    return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  }

  function isActive(link: { href: string; label: string }) {
    const current = normalizePath(pathname);
    const target = normalizePath(link.href);
    if (target === '/dashboard') return current === '/dashboard';
    return current === target || current.startsWith(target + '/');
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-800">
        <span className="text-2xl font-extrabold">Oribeti</span>
        <button onClick={() => setShowMenu(true)} className="text-white p-2 focus:outline-none">
          <FaBars className="w-7 h-7" />
        </button>
      </div>
      {/* Sidebar (drawer no mobile) */}
      <aside className={`
        fixed z-40 top-0 left-0 h-full w-64 bg-gray-800 p-6 flex flex-col gap-8 min-h-screen transition-transform duration-300
        ${showMenu ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:flex
      `} style={{ maxWidth: '100vw' }}>
        {/* Fechar no mobile */}
        <div className="md:hidden flex justify-end mb-4">
          <button onClick={() => setShowMenu(false)} className="text-white p-2 focus:outline-none">
            <FaTimes className="w-7 h-7" />
          </button>
        </div>
        {/* Logo Oribeti */}
        <div className="mb-6 flex items-center justify-center">
          <Link href="/dashboard" className="text-3xl font-extrabold tracking-wide text-white drop-shadow-lg select-none hover:text-green-400 transition-colors" title="Ir para Resumo Geral">
            Oribeti
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-8">
          {!userInfo ? (
            // Skeleton ou loading
            <div className="animate-pulse flex items-center gap-3">
              <div className="bg-gray-700 rounded-full w-10 h-10" />
              <div>
                <div className="bg-gray-700 h-4 w-24 rounded mb-1" />
                <div className="bg-gray-700 h-3 w-16 rounded" />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {userInfo.nome.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{userInfo.nome}</div>
                <div className="text-xs text-gray-400">{userInfo.tipo === 'ADMIN' ? 'Administrador' : 'Revendedor'}</div>
              </div>
            </>
          )}
        </div>
        <nav className="flex flex-col gap-2 mb-8">
          {menuItems.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={
                isActive(link)
                  ? 'bg-green-600 rounded px-3 py-2 font-medium flex items-center transition-all duration-300 shadow-lg scale-[1.03]'
                  : 'hover:bg-gray-700 rounded px-3 py-2 flex items-center transition-all duration-300'
              }
              style={{ transition: 'background 0.3s, box-shadow 0.3s, transform 0.2s' }}
              onClick={() => setShowMenu(false)}
            >
              {link.icon}
              <span className={link.label === 'Registo Vendas' ? 'whitespace-nowrap' : ''}>{link.label}</span>
              {link.label === 'Devedores' && numDevedores > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
                  {numDevedores}
                </span>
              )}
            </a>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
          disabled={loggingOut}
        >
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
        {logoutMsg && <div className="mt-4 bg-green-700 text-white text-center rounded p-2">{logoutMsg}</div>}
      </aside>
      {/* Overlay para fechar o menu no mobile */}
      {showMenu && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-40 md:hidden" onClick={() => setShowMenu(false)}></div>
      )}
      {/* Main Content */}
      <section className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <Transition
          appear
          show={true}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-4"
        >
          <div>
            {children}
          </div>
        </Transition>
      </section>
      {/* Widget de usuários online - mobile */}
      {!modalAberto && (
        <div className="fixed z-50 top-2 right-32 md:hidden flex flex-col items-center gap-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-2 flex items-center gap-1 focus:outline-none transition"
            onClick={() => setShowOnline(v => !v)}
            title="Usuários online"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <FaUserCircle className="text-lg" />
            <span className="bg-white text-green-700 rounded-full px-1.5 text-xs font-bold">{onlineUsers.length}</span>
          </button>
          {showOnline && (
            <div className="bg-gray-900 border border-green-700 rounded-xl shadow-2xl p-3 min-w-[180px] max-w-xs max-h-80 overflow-y-auto scrollbar-custom animate-fadeIn mt-2">
              <div className="font-bold text-green-400 mb-2 flex items-center gap-2 text-sm"><FaUserCircle /> Online</div>
              {onlineUsers.length === 0 ? (
                <div className="text-gray-400 text-xs">Ninguém online agora.</div>
              ) : (
                <ul className="space-y-1">
                  {onlineUsers.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-800 transition">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="font-semibold text-white text-sm">{u.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-800 text-green-200 ml-auto">{u.tipo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {/* Widget de usuários online - desktop */}
      {!modalAberto && (
        <div className="fixed z-50 bottom-6 right-6 hidden md:flex flex-col items-end gap-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 flex items-center gap-2 focus:outline-none transition"
            onClick={() => setShowOnline(v => !v)}
            title="Usuários online"
          >
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <FaUserCircle className="text-xl" />
            <span className="font-bold">Online</span>
            <span className="ml-1 bg-white text-green-700 rounded-full px-2 text-xs font-bold">{onlineUsers.length}</span>
          </button>
          {showOnline && (
            <div className="bg-gray-900 border border-green-700 rounded-xl shadow-2xl p-4 min-w-[220px] max-w-xs max-h-80 overflow-y-auto scrollbar-custom animate-fadeIn mt-2">
              <div className="font-bold text-green-400 mb-2 flex items-center gap-2"><FaUserCircle /> Usuários Online</div>
              {onlineUsers.length === 0 ? (
                <div className="text-gray-400 text-sm">Ninguém online agora.</div>
              ) : (
                <ul className="space-y-2">
                  {onlineUsers.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 transition">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="font-semibold text-white">{u.nome}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-800 text-green-200 ml-auto">{u.tipo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Widget de notificações - mobile */}
      {!modalAberto && (
        <div className="fixed z-50 top-2 right-16 md:hidden">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-2 flex items-center gap-1 focus:outline-none transition relative"
            onClick={() => setShowNotificacoes(v => !v)}
            title="Notificações"
          >
            <FaBell className="text-lg" />
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </button>
          {showNotificacoes && (
            <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-blue-700 rounded-xl shadow-2xl min-w-[280px] max-w-sm max-h-80 overflow-y-auto">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="font-bold text-blue-400 flex items-center gap-2">
                  <FaBell /> Notificações
                </div>
                {totalNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasNotificacoesLidas}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="p-4 text-gray-400 text-sm text-center">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-800 hover:bg-gray-800 transition ${
                        !notif.lida ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notif.lida ? 'bg-blue-500' : 'bg-gray-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white mb-1">
                            {notif.titulo}
                          </div>
                          <div className="text-xs text-gray-300 mb-1">
                            {notif.mensagem}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatarDataNotificacao(notif.criadoEm)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widget de notificações - desktop */}
      {!modalAberto && (
        <div className="fixed z-50 bottom-20 right-6 hidden md:block">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-3 flex items-center gap-2 focus:outline-none transition relative"
            onClick={() => setShowNotificacoes(v => !v)}
            title="Notificações"
          >
            <FaBell className="text-xl" />
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </button>
          {showNotificacoes && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-blue-700 rounded-xl shadow-2xl min-w-[320px] max-w-sm max-h-80 overflow-y-auto">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="font-bold text-blue-400 flex items-center gap-2">
                  <FaBell /> Notificações
                </div>
                {totalNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasNotificacoesLidas}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="p-4 text-gray-400 text-sm text-center">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-800 hover:bg-gray-800 transition ${
                        !notif.lida ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notif.lida ? 'bg-blue-500' : 'bg-gray-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white mb-1">
                            {notif.titulo}
                          </div>
                          <div className="text-xs text-gray-300 mb-1">
                            {notif.mensagem}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatarDataNotificacao(notif.criadoEm)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
} 