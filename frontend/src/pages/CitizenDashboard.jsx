// `/citizen` portal. Full reporting UI implemented starting Phase 3 (Citizen Reporting + AI
// Verification) — see README section 6. This placeholder exists so Phase 2's role-based
// redirect has somewhere real to land.

import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function CitizenDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass p-8">
          <p className="text-xs uppercase tracking-wide text-route">Citizen portal</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Welcome, {user.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Incident reporting and AI verification land in Phase 3.
          </p>
        </div>
      </main>
    </div>
  );
}

export default CitizenDashboard;
