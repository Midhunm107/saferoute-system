import { useEffect, useState } from 'react';
import axiosClient from './api/axiosClient';

// Phase 0 placeholder — no routing/portals wired up yet (see README section 6, Phase 0 DoD).
// Styled per section 3.5 (Neomorphic Glass Aerodynamics): Background Canvas + Card Surface.
function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosClient
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const statusIsOk = health?.data?.status === 'ok';

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-glass p-8">
        <h1 className="text-2xl font-semibold text-white">SafeRoute</h1>
        <p className="mt-1 text-sm text-slate-400">Phase 0 — scaffolding placeholder</p>

        <div className="mt-6 rounded-xl bg-black/30 border border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Backend health check</p>

          {!health && !error && <p className="mt-1 font-mono text-sm text-slate-400">Checking…</p>}

          {health && (
            <p
              className={`mt-1 font-mono text-sm ${
                statusIsOk ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {health.data.status} · {health.data.service}
            </p>
          )}

          {error && <p className="mt-1 font-mono text-sm text-rose-400">{error}</p>}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          GET <span className="font-mono">/api/health</span> —{' '}
          {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
        </p>
      </div>
    </div>
  );
}

export default App;
