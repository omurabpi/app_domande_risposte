import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenziali non valide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <img src="/logo_ometec_bianco.png" alt="Ometec" className="h-8 mb-10" />

      <div className="w-full max-w-sm">
        <div className="bg-white/4 border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Accesso Staff</h1>
          <p className="text-white/40 text-sm mb-6">Area riservata — team Ometec</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Il tuo username"
                autoComplete="username"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-white text-sm placeholder:text-white/20
                           focus:outline-none focus:border-[#C81B17]/50 focus:ring-1 focus:ring-[#C81B17]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-white text-sm placeholder:text-white/20
                           focus:outline-none focus:border-[#C81B17]/50 focus:ring-1 focus:ring-[#C81B17]/20 transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#C81B17]/10 text-red-400 border border-[#C81B17]/20 rounded-xl px-4 py-3 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-[#C81B17] hover:bg-[#a01512] disabled:bg-[#C81B17]/25
                         disabled:text-white/30 text-white font-semibold py-2.5 px-6 rounded-xl
                         transition flex items-center justify-center gap-2 mt-1 cursor-pointer"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

