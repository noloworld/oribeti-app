"use client";

import React, { useState, useEffect } from 'react';

interface Sorteio {
  id: number;
  nome: string;
  dataCriacao: string;
  participacoes: { id: number; clienteId?: number; cliente?: { id: number; nome: string } }[];
  encerrado: boolean;
  vencedorId?: number;
}

interface Cliente {
  id: number;
  nome: string;
}

interface Participante {
  id: number;
  numero: number;
  data: string;
  cliente: { id: number; nome: string };
}

const SorteiosPage = () => {
  const [tab, setTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nomeSorteio, setNomeSorteio] = useState('');
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);
  const [showParticipanteModal, setShowParticipanteModal] = useState(false);
  const [sorteioSelecionado, setSorteioSelecionado] = useState<Sorteio | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [numero, setNumero] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [erroParticipante, setErroParticipante] = useState<string | null>(null);
  const [showVencedorModal, setShowVencedorModal] = useState(false);
  const [numeroVencedor, setNumeroVencedor] = useState('');
  const [encerrando, setEncerrando] = useState(false);
  const [mensagemVencedor, setMensagemVencedor] = useState<string | null>(null);
  const [erroVencedor, setErroVencedor] = useState<string | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [erroVer, setErroVer] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  const fetchSorteios = () => {
    setLoading(true);
    setErro(null);
    const url = tab === 'ativos' ? '/api/sorteios' : '/api/sorteios/arquivados';
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao buscar sorteios');
        return res.json();
      })
      .then((data) => setSorteios(data))
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSorteios();
    // eslint-disable-next-line
  }, [tab]);

  const handleCriarSorteio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    setErroCriar(null);
    try {
      const res = await fetch('/api/sorteios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeSorteio }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar sorteio');
      }
      setShowModal(false);
      setNomeSorteio('');
      fetchSorteios();
    } catch (err: any) {
      setErroCriar(err.message);
    } finally {
      setCriando(false);
    }
  };

  const abrirModalParticipante = async (sorteio: Sorteio) => {
    setSorteioSelecionado(sorteio);
    setShowParticipanteModal(true);
    setErroParticipante(null);
    setClienteId('');
    setNumero('');
    // Buscar clientes
    try {
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('Erro ao buscar clientes');
      const data = await res.json();
      setClientes(data);
    } catch (err: any) {
      setErroParticipante(err.message);
    }
  };

  const handleAdicionarParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdicionando(true);
    setErroParticipante(null);
    try {
      if (!clienteId || !numero) throw new Error('Selecione o cliente e o número');
      const res = await fetch(`/api/sorteios/${sorteioSelecionado?.id}/participar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: Number(clienteId), numero: Number(numero) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar participante');
      setShowParticipanteModal(false);
      fetchSorteios();
    } catch (err: any) {
      setErroParticipante(err.message);
    } finally {
      setAdicionando(false);
    }
  };

  const abrirModalVencedor = (sorteio: Sorteio) => {
    setSorteioSelecionado(sorteio);
    setNumeroVencedor('');
    setMensagemVencedor(null);
    setErroVencedor(null);
    setShowVencedorModal(true);
  };

  const handleInserirVencedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setEncerrando(true);
    setErroVencedor(null);
    setMensagemVencedor(null);
    try {
      if (!numeroVencedor) throw new Error('Digite o número vencedor');
      const res = await fetch(`/api/sorteios/${sorteioSelecionado?.id}/encerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroVencedor: Number(numeroVencedor) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao encerrar sorteio');
      setMensagemVencedor(data.mensagem || 'Sorteio encerrado!');
      fetchSorteios();
    } catch (err: any) {
      setErroVencedor(err.message);
    } finally {
      setEncerrando(false);
    }
  };

  const abrirModalVer = async (sorteio: Sorteio) => {
    setSorteioSelecionado(sorteio);
    setShowVerModal(true);
    setParticipantes([]);
    setErroVer(null);
    setLoadingParticipantes(true);
    try {
      const res = await fetch(`/api/sorteios/${sorteio.id}/participantes`);
      if (!res.ok) throw new Error('Erro ao buscar participantes');
      const data = await res.json();
      setParticipantes(data);
    } catch (err: any) {
      setErroVer(err.message);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleRemoverParticipacao = async (participacaoId: number) => {
    if (!window.confirm('Remover esta participação?')) return;
    setRemovendoId(participacaoId);
    try {
      // Aqui você pode implementar a chamada DELETE na API se desejar
      // await fetch(`/api/sorteios/participacao/${participacaoId}`, { method: 'DELETE' });
      // fetch novamente os participantes
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sorteios</h1>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'ativos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-white'
          }`}
          onClick={() => setTab('ativos')}
        >
          Ativos
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${
            tab === 'arquivados'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-white'
          }`}
          onClick={() => setTab('arquivados')}
        >
          Arquivados
        </button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {tab === 'ativos' ? 'Sorteios Ativos' : 'Sorteios Arquivados'}
        </h2>
        {tab === 'ativos' && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={() => setShowModal(true)}
          >
            + Adicionar Sorteio
          </button>
        )}
      </div>
      <div className="bg-gray-800 rounded p-4 shadow min-h-[200px]">
        {/* Mobile: Cards verticais */}
        <div className="block sm:hidden">
          {sorteios.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum sorteio encontrado.</div>
          ) : (
            sorteios.map((sorteio) => (
              <div key={sorteio.id} className="bg-gray-900 rounded-lg p-4 mb-4 shadow flex flex-col gap-2">
                <div><span className="font-semibold">Nome:</span> {sorteio.nome}</div>
                {tab === 'arquivados' ? null : (
                  <div><span className="font-semibold">Data de Criação:</span> {new Date(sorteio.dataCriacao).toLocaleDateString()}</div>
                )}
                <div><span className="font-semibold">Total de Participantes:</span> {sorteio.participacoes?.length ?? 0}</div>
                <div>
                  <span className="font-semibold">Vencedor:</span> {sorteio.vencedorId && sorteio.participacoes ? (
                    <span className="text-green-600 font-semibold">
                      {sorteio.participacoes.find(p => p.clienteId === sorteio.vencedorId)?.cliente?.nome || '—'}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    className="bg-blue-100 text-blue-700 rounded-md px-3 py-1 font-semibold hover:bg-blue-200 transition"
                    onClick={() => abrirModalVer(sorteio)}
                  >
                    Ver
                  </button>
                  {tab === 'ativos' && (
                    <>
                      <button
                        className="bg-green-100 text-green-700 rounded-md px-3 py-1 font-semibold hover:bg-green-200 transition"
                        onClick={() => abrirModalParticipante(sorteio)}
                      >
                        Adicionar Cliente
                      </button>
                      <button
                        className="bg-yellow-100 text-yellow-800 rounded-md px-3 py-1 font-semibold hover:bg-yellow-200 transition"
                        onClick={() => abrirModalVencedor(sorteio)}
                      >
                        Inserir Número Vencedor
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop/tablet: Tabela tradicional */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Nome</th>
                <th className="py-2 px-2">Data de Criação</th>
                <th className="py-2 px-2">Total de Participantes</th>
                <th className="py-2 px-2">Vencedor</th>
                <th className="py-2 px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorteios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Nenhum sorteio encontrado.</td>
                </tr>
              ) : (
                sorteios.map((sorteio) => (
                  <tr key={sorteio.id}>
                    <td className="py-2 px-2">{sorteio.nome}</td>
                    <td className="py-2 px-2">{new Date(sorteio.dataCriacao).toLocaleDateString()}</td>
                    <td className="py-2 px-2">{sorteio.participacoes?.length ?? 0}</td>
                    <td className="py-2 px-2">
                      {sorteio.vencedorId && sorteio.participacoes ? (
                        <span className="text-green-600 font-semibold">
                          {sorteio.participacoes.find(p => p.clienteId === sorteio.vencedorId)?.cliente?.nome || '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          className="bg-blue-100 text-blue-700 rounded-md px-3 py-1 font-semibold hover:bg-blue-200 transition"
                          onClick={() => abrirModalVer(sorteio)}
                        >
                          Ver
                        </button>
                        {tab === 'ativos' && (
                          <>
                            <button
                              className="bg-green-100 text-green-700 rounded-md px-3 py-1 font-semibold hover:bg-green-200 transition"
                              onClick={() => abrirModalParticipante(sorteio)}
                            >
                              Adicionar Cliente
                            </button>
                            <button
                              className="bg-yellow-100 text-yellow-800 rounded-md px-3 py-1 font-semibold hover:bg-yellow-200 transition"
                              onClick={() => abrirModalVencedor(sorteio)}
                            >
                              Inserir Número Vencedor
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criar sorteio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white text-black rounded-lg p-8 w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Adicionar Sorteio</h3>
            <form onSubmit={handleCriarSorteio}>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-4 text-black"
                placeholder="Nome do sorteio"
                value={nomeSorteio}
                onChange={e => setNomeSorteio(e.target.value)}
                required
                maxLength={100}
              />
              {erroCriar && <div className="text-red-500 mb-2">{erroCriar}</div>}
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition w-full"
                disabled={criando}
              >
                {criando ? 'Criando...' : 'Criar Sorteio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de adicionar participante */}
      {showParticipanteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowParticipanteModal(false); }}>
          <div className="bg-white text-black rounded-lg p-8 w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowParticipanteModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Adicionar Participante</h3>
            <form onSubmit={handleAdicionarParticipante}>
              <label className="block mb-2 text-black">Cliente</label>
              <select
                className="w-full border rounded px-3 py-2 mb-4 text-black"
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                required
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <label className="block mb-2 text-black">Número escolhido</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 mb-4 text-black"
                placeholder="Número"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                required
                min={1}
              />
              {erroParticipante && <div className="text-red-500 mb-2">{erroParticipante}</div>}
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition w-full"
                disabled={adicionando}
              >
                {adicionando ? 'Adicionando...' : 'Adicionar Participante'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de inserir número vencedor */}
      {showVencedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowVencedorModal(false); }}>
          <div className="bg-white text-black rounded-lg p-8 w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowVencedorModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Inserir Número Vencedor</h3>
            <form onSubmit={handleInserirVencedor}>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 mb-4 text-black"
                placeholder="Número vencedor"
                value={numeroVencedor}
                onChange={e => setNumeroVencedor(e.target.value)}
                required
                min={1}
              />
              {erroVencedor && <div className="text-red-500 mb-2">{erroVencedor}</div>}
              {mensagemVencedor && <div className="text-green-600 mb-2">{mensagemVencedor}</div>}
              <button
                type="submit"
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition w-full"
                disabled={encerrando}
              >
                {encerrando ? 'Encerrando...' : 'Encerrar Sorteio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de ver participantes */}
      {showVerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowVerModal(false); }}>
          <div className="bg-white text-black rounded-lg p-8 w-full max-w-2xl shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowVerModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Participantes do Sorteio: {sorteioSelecionado?.nome}</h3>
            {/* Vencedor em destaque se sorteio encerrado */}
            {sorteioSelecionado?.encerrado && sorteioSelecionado?.vencedorId && participantes.length > 0 && (
              (() => {
                const vencedor = participantes.find(p => p.cliente.id === sorteioSelecionado.vencedorId);
                if (!vencedor) return null;
                return (
                  <div className="mb-4 text-lg">
                    <span className="font-semibold">Vencedor: </span>
                    <span className="text-green-600 font-bold">{vencedor.cliente.nome}</span>
                    <span className="ml-2 text-gray-700">(Número: {vencedor.numero})</span>
                  </div>
                );
              })()
            )}
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-2">Nome do Cliente</th>
                  <th className="py-2 px-2">Número</th>
                  <th className="py-2 px-2">Data</th>
                  {/* Só mostra Ações se sorteio não estiver encerrado */}
                  {sorteioSelecionado && sorteioSelecionado.encerrado === false && (
                    <th className="py-2 px-2">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-2">{p.cliente.nome}</td>
                    <td className="py-2 px-2">{p.numero}</td>
                    <td className="py-2 px-2">{new Date(p.data).toLocaleString()}</td>
                    {/* Só mostra Remover se sorteio não estiver encerrado */}
                    {sorteioSelecionado && sorteioSelecionado.encerrado === false && (
                      <td className="py-2 px-2">
                        <button
                          className="text-red-500 hover:underline"
                          disabled={removendoId === p.id}
                          onClick={async () => {
                            if (!window.confirm('Remover esta participação?')) return;
                            setRemovendoId(p.id);
                            try {
                              await fetch(`/api/sorteios/${sorteioSelecionado?.id}/participantes?idParticipacao=${p.id}`, { method: 'DELETE' });
                              setParticipantes(participantes.filter((x) => x.id !== p.id));
                              fetchSorteios();
                            } finally {
                              setRemovendoId(null);
                            }
                          }}
                        >
                          Remover
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SorteiosPage; 