// Login/register screen — see README section 6, Phase 2 (Auth & RBAC). Styled per App.jsx's
// glass Card Surface: recessed inputs, tactile pill submit button.

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_DASHBOARD_PATH } from '../constants';

const inputClass =
  'w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-route/50';

const initialForm = { name: '', email: '', phone: '', password: '', role: 'CITIZEN' };

function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in (e.g. cookie still valid from a previous visit) — no reason to show
  // the form again.
  if (user) {
    return <Navigate to={ROLE_DASHBOARD_PATH[user.role]} replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register(form);
      navigate(ROLE_DASHBOARD_PATH[loggedInUser.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass p-8">
        <h1 className="text-2xl font-semibold text-white">SafeRoute</h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </p>

        <div className="mt-6 flex rounded-xl bg-black/30 border border-white/10 p-1">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition ${
                mode === m ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                required
                className={inputClass}
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                required
                className={inputClass}
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputClass}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            className={inputClass}
          />

          {error && (
            <div className="rounded-xl bg-emergency/10 border border-emergency/30 px-4 py-2 text-sm text-emergency">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-safe py-2.5 text-sm font-semibold text-white shadow-glass transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
