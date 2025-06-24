'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaChartPie, FaShoppingCart, FaGift, FaUsers, FaExclamationTriangle, FaMoneyBillWave, FaCog } from 'react-icons/fa';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutMsg, setLogoutMsg] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<{ nome: string; tipo: string } | null>(null);
  const [numDevedores, setNumDevedores] = useState(0);

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
    <main className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      {mounted && (
        <aside className="w-64 bg-gray-800 p-6 flex flex-col gap-8 min-h-screen">
          {/* Logo Oribeti */}
          <div className="mb-6 flex items-center justify-center">
            <span className="text-3xl font-extrabold tracking-wide text-white drop-shadow-lg select-none">Oribeti</span>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center font-bold">
              {userInfo ? userInfo.nome.slice(0,2).toUpperCase() : 'NS'}
            </div>
            <div>
              <div className="font-semibold">{userInfo ? userInfo.nome : 'Nome Admin'}</div>
              <div className="text-xs text-gray-400">{userInfo ? (userInfo.tipo === 'ADMIN' ? 'Administrador' : 'Revendedor') : 'Administrador'}</div>
            </div>
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
      )}
      {/* Main Content */}
      <section className="flex-1 p-6">
        {children}
      </section>
    </main>
  );
} 