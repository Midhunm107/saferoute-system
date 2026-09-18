// `/police` portal. Full incident queue implemented in Phase 6 (Police Portal) — see README
// section 6. This placeholder exists so Phase 2's role-based redirect has somewhere real to
// land. Confirm actions will use emerald, reject actions rose, once Phase 6 builds the queue.

import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function PoliceDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass p-8">
          <p className="text-xs uppercase tracking-wide text-safe">Police portal</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Welcome, {user.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            The station incident queue lands in Phase 6.
          </p>
        </div>
      </main>
    </div>
  );
}

export default PoliceDashboard;
