'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaChartPie, FaShoppingCart, FaGift, FaUsers, FaExclamationTriangle, FaMoneyBillWave, FaCog, FaBars, FaTimes } from 'react-icons/fa';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutMsg, setLogoutMsg] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<{ nome: string; tipo: string } | null>(null);
  const [numDevedores, setNumDevedores] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

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

  async function handleLogout() {
    setLogoutMsg('Logout realizado com sucesso!');
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setTimeout(() => {
      router.push('/login');
    }, 1200);
  }

  const links = [
    { href: '/dashboard', label: 'Resumo Geral', icon: <FaChartPie className="text-lg mr-2" /> },
    { href: '/dashboard/vendas', label: 'Registo Vendas', icon: <FaShoppingCart className="text-lg mr-2" /> },
    { href: '/dashboard/clientes', label: 'Clientes', icon: <FaUsers className="text-lg mr-2" /> },
    { href: '/dashboard/devedores', label: 'Devedores', icon: <FaExclamationTriangle className="text-lg mr-2" /> },
    { href: '/dashboard/despesas', label: 'Despesas', icon: <FaMoneyBillWave className="text-lg mr-2" /> },
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
          <span className="text-3xl font-extrabold tracking-wide text-white drop-shadow-lg select-none">Oribeti</span>
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
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={
                isActive(link)
                  ? 'bg-green-600 rounded px-3 py-2 font-medium flex items-center'
                  : 'hover:bg-gray-700 rounded px-3 py-2 flex items-center'
              }
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
        {children}
      </section>
    </main>
  );
} 