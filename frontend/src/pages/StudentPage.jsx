import { useState } from 'react';
import api from '../api/client';

export default function StudentPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/questions', { text });
      setStatus('success');
      setText('');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const remaining = 1000 - text.length;

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
        {/* Success state full-screen */}
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <svg className="w-9 h-9 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Domanda inviata!</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Il team Ometec la leggerà durante la presentazione.
            </p>
          </div>
          <button
            onClick={() => setStatus(null)}
            className="mt-2 text-sm text-white/40 hover:text-white/70 transition underline underline-offset-4 cursor-pointer"
          >
            Invia un&apos;altra domanda
          </button>
        </div>
        <img src="/logo_ometec_bianco.png" alt="Ometec" className="h-6 absolute bottom-8 opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">

      {/* Ambient glow sfondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#C81B17]/6 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/6 bg-[#09090b]/60 backdrop-blur">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/logo_ometec_bianco.png" alt="Ometec" className="h-7" />
          <span className="text-xs text-white/25 bg-white/5 border border-white/8 px-3 py-1 rounded-full">
            100% anonimo
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Titolo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C81B17]/10 border border-[#C81B17]/20 mb-5">
              <svg className="w-7 h-7 text-[#C81B17]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Fai una domanda
            </h1>
            <p className="text-white/35 text-sm leading-relaxed max-w-sm mx-auto">
              La tua domanda è completamente anonima.<br />
              Il team Ometec la leggerà durante la presentazione.
            </p>
          </div>

          {/* Card form */}
          <div className="bg-white/3 border border-white/8 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Scrivi qui la tua domanda..."
                  rows={6}
                  maxLength={1000}
                  className="w-full px-5 py-4 bg-white/4 border border-white/8 rounded-2xl
                             text-white text-base placeholder:text-white/20 leading-relaxed
                             focus:outline-none focus:border-[#C81B17]/50 focus:bg-white/5
                             resize-none transition-all duration-200"
                />
                {/* Counter badge */}
                <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
                  ${remaining < 100 ? 'text-[#C81B17]/70' : 'text-white/20'}`}>
                  {remaining}
                </span>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 bg-red-500/8 text-red-400 border border-red-500/15 rounded-2xl px-4 py-3 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Errore nell&apos;invio. Controlla la connessione e riprova.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="group w-full relative overflow-hidden bg-[#C81B17] hover:bg-[#b01815]
                           disabled:bg-white/6 disabled:text-white/20
                           text-white font-semibold py-4 px-6 rounded-2xl
                           transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer
                           shadow-lg shadow-[#C81B17]/20 disabled:shadow-none"
              >
                {/* Shimmer on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent
                                 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span className="relative">
                  {loading ? 'Invio in corso...' : 'Invia domanda'}
                </span>
              </button>
            </form>
          </div>

          {/* Privacy note */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <svg className="w-3.5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-white/18">
              Nessun dato personale viene registrato
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

