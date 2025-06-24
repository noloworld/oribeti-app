"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.message || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900">
      <div className="w-full max-w-md flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-white mb-8 tracking-wide drop-shadow-lg select-none">Oribeti</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full flex flex-col gap-5 border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-2 text-center text-white">Acessar Painel</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-white/20 bg-white/20 text-white placeholder-gray-300 rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <div className="relative">
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              className="border border-white/20 bg-white/20 text-white placeholder-gray-300 rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full pr-12"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowSenha(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white focus:outline-none"
              aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {showSenha ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.845 6.07 6.75 9.75 6.75 1.772 0 3.543-.5 5.02-1.477M6.53 6.53A6.75 6.75 0 0 1 12 5.25c3.68 0 7.714 2.905 9.75 6.75a10.45 10.45 0 0 1-4.478 4.978M6.53 6.53l10.94 10.94M6.53 6.53 3.98 8.223m13.49 13.49-2.548-2.548" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.75 0c-2.036-3.845-6.07-6.75-9.75-6.75-1.772 0-3.543.5-5.02 1.477M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.845 6.07 6.75 9.75 6.75 1.772 0 3.543-.5 5.02-1.477" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded font-semibold hover:from-blue-700 hover:to-purple-700 transition text-lg shadow-lg flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <img src="/gear.gif" alt="Carregando" className="w-6 h-6 inline-block mr-2" />
                Entrando
              </>
            ) : "Acessar Painel"}
          </button>
          {error && <div className="text-red-400 text-sm text-center font-semibold bg-white/10 rounded p-2">{error}</div>}
        </form>
      </div>
    </main>
  );
} 