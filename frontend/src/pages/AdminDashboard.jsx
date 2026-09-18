// `/admin` portal. Full analytics/blacklist/threshold UI implemented in Phase 8 (Admin
// Module) — see README section 6. This placeholder exists so Phase 2's role-based redirect
// has somewhere real to land.

import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass p-8">
          <p className="text-xs uppercase tracking-wide text-warning">Admin portal</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Welcome, {user.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Analytics, blacklist, and threshold controls land in Phase 8.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
