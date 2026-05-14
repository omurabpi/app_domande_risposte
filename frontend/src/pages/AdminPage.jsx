import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const FILTERS = [
  { key: 'all', label: 'Tutte' },
  { key: 'unread', label: 'Non lette' },
  { key: 'highlighted', label: 'In evidenza' },
  { key: 'public', label: 'Pubbliche' },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await api.get('/questions');
      setQuestions(res.data);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 20000);
    return () => clearInterval(interval);
  }, [fetchQuestions]);

  const handleUpdate = async (id, patch) => {
    setUpdating(id);
    try {
      await api.patch(`/questions/${id}`, patch);
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    } catch { alert('Errore nell\'aggiornamento.'); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa domanda?')) return;
    setUpdating(id);
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch { alert('Errore nell\'eliminazione.'); }
    finally { setUpdating(null); }
  };

  const handleLogout = () => { logout(); navigate('/admin/login', { replace: true }); };

  const filtered = questions.filter((q) => {
    if (filter === 'unread') return !q.is_read;
    if (filter === 'highlighted') return q.is_highlighted;
    if (filter === 'public') return q.is_public;
    return true;
  });

  const counts = {
    all: questions.length,
    unread: questions.filter((q) => !q.is_read).length,
    highlighted: questions.filter((q) => q.is_highlighted).length,
    public: questions.filter((q) => q.is_public).length,
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Navbar */}
      <header className="border-b border-white/8 sticky top-0 z-10 bg-[#09090b]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Gestione Domande</h1>
          <div className="flex items-center gap-4">
            <img src="/logo_ometec_bianco.png" alt="Ometec" className="h-5 hidden sm:block" />
            <span className="text-sm text-white/40 hidden sm:block">
              {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-[#C81B17] transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* Stats / filter tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-xl p-4 text-left transition border cursor-pointer
                ${filter === key
                  ? 'bg-[#C81B17]/15 border-[#C81B17]/40 text-white'
                  : 'bg-white/4 border-white/8 text-white/60 hover:border-white/15'}`}
            >
              <div className={`text-2xl font-bold ${filter === key ? 'text-[#C81B17]' : 'text-white/80'}`}>
                {counts[key]}
              </div>
              <div className="text-xs mt-0.5">{label}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
            {FILTERS.find((f) => f.key === filter)?.label} ({filtered.length})
          </h2>
          <button
            onClick={fetchQuestions}
            className="text-sm text-white/40 hover:text-white transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Aggiorna
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-[#C81B17]/40 border-t-[#C81B17] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/4 border border-white/8 rounded-2xl p-10 text-center">
            <p className="text-white/30 text-sm">Nessuna domanda in questa categoria.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border p-5 transition
                  ${q.is_highlighted ? 'bg-[#C81B17]/6 border-[#C81B17]/25' : 'bg-white/4 border-white/8'}
                  ${q.is_read ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className={`text-sm leading-relaxed flex-1 ${q.is_read ? 'text-white/40' : 'text-white/85'}`}>
                    {q.text}
                  </p>
                  {updating === q.id && (
                    <div className="w-4 h-4 border-2 border-[#C81B17]/40 border-t-[#C81B17] rounded-full animate-spin shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {q.is_highlighted && (
                    <span className="text-xs bg-[#C81B17]/15 text-[#C81B17] border border-[#C81B17]/20 px-2 py-0.5 rounded-full font-medium">
                      ★ In evidenza
                    </span>
                  )}
                  {q.is_public && (
                    <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                      Pubblica
                    </span>
                  )}
                  {q.is_read && (
                    <span className="text-xs bg-white/5 text-white/30 border border-white/8 px-2 py-0.5 rounded-full">
                      Letta
                    </span>
                  )}
                  <span className="text-xs text-white/20 ml-auto">
                    {new Date(q.created_at).toLocaleString('it-IT')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/6">
                  <button
                    disabled={updating === q.id}
                    onClick={() => handleUpdate(q.id, { is_read: !q.is_read })}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition border cursor-pointer
                               border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                  >
                    {q.is_read ? 'Segna non letta' : '✓ Segna letta'}
                  </button>

                  <button
                    disabled={updating === q.id}
                    onClick={() => handleUpdate(q.id, { is_highlighted: !q.is_highlighted })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border cursor-pointer
                      ${q.is_highlighted
                        ? 'border-[#C81B17]/30 bg-[#C81B17]/10 text-[#C81B17] hover:bg-[#C81B17]/15'
                        : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'}`}
                  >
                    {q.is_highlighted ? '★ Rimuovi evidenza' : '☆ Metti in evidenza'}
                  </button>

                  <button
                    disabled={updating === q.id}
                    onClick={() => handleUpdate(q.id, { is_public: !q.is_public })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border cursor-pointer
                      ${q.is_public
                        ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/15'
                        : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'}`}
                  >
                    {q.is_public ? 'Rendi privata' : '↑ Pubblica sulla bacheca'}
                  </button>

                  <button
                    disabled={updating === q.id}
                    onClick={() => handleDelete(q.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition border cursor-pointer
                               border-white/10 text-white/30 hover:border-[#C81B17]/30 hover:text-[#C81B17] ml-auto"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

