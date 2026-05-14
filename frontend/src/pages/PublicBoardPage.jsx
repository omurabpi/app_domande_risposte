import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export default function PublicBoardPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await api.get('/questions/public');
      setQuestions(res.data);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 15000);
    return () => clearInterval(interval);
  }, [fetchQuestions]);

  const highlighted = questions.filter((q) => q.is_highlighted);
  const normal = questions.filter((q) => !q.is_highlighted);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col overflow-hidden">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#C81B17]/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative flex-shrink-0 border-b border-white/6 bg-[#09090b]/80 backdrop-blur px-10 py-5 flex items-center justify-between">
        <img src="/logo_ometec_bianco.png" alt="Ometec" className="h-9" />
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${pulse ? 'bg-[#C81B17] scale-125' : 'bg-[#C81B17]/35'}`} />
          <span className="text-sm text-white/30 tracking-wide">Live</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col px-10 py-8 overflow-auto">

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#C81B17]/40 border-t-[#C81B17] rounded-full animate-spin" />
          </div>

        ) : questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center">
              <svg className="w-9 h-9 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-white/25 text-2xl font-light">In attesa di domande…</p>
          </div>

        ) : (
          <div className="flex-1 flex flex-col gap-8">

            {/* IN EVIDENZA — massima visibilità */}
            {highlighted.length > 0 && (
              <section className="flex-shrink-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full bg-[#C81B17]" />
                  <span className="text-sm font-bold text-[#C81B17] uppercase tracking-[0.2em]">In evidenza</span>
                </div>
                <div className={`grid gap-5 ${highlighted.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {highlighted.map((q) => (
                    <div
                      key={q.id}
                      className="relative rounded-3xl border border-[#C81B17]/30 bg-gradient-to-br from-[#C81B17]/12 to-[#C81B17]/4 p-8 overflow-hidden"
                    >
                      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#C81B17]/10 blur-3xl pointer-events-none" />
                      <p className="relative text-white text-2xl sm:text-3xl font-semibold leading-snug">
                        {q.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ALTRE DOMANDE — grandi, leggibili */}
            {normal.length > 0 && (
              <section className="flex-1">
                {highlighted.length > 0 && (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-6 rounded-full bg-white/15" />
                    <span className="text-sm font-bold text-white/30 uppercase tracking-[0.2em]">Altre domande</span>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {normal.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-white/8 bg-white/4 px-7 py-6 flex items-start gap-4"
                    >
                      <svg className="w-5 h-5 text-white/20 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-white/80 text-xl font-medium leading-snug">{q.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

