// Top nav across portals — see README section 6, Phase 2 (Auth & RBAC). Card Surface +
// tactile pill button styling, matching App.jsx's Phase 0 placeholder.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_ACCENT = {
  CITIZEN: 'text-route',
  POLICE: 'text-safe',
  AMBULANCE: 'text-emergency',
  ADMIN: 'text-warning',
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-white">SafeRoute</span>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              {user.name}{' '}
              <span className={`font-mono text-xs uppercase ${ROLE_ACCENT[user.role]}`}>
                {user.role}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
