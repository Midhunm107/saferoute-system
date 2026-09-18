// Current-user/session context — see README section 6, Phase 2 (Auth & RBAC).
// The JWT itself lives in an HTTP-only cookie (set by the backend), so this context never
// touches the token directly; it just tracks who that cookie currently resolves to.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

// Pulls the { success, error } string the backend always sends (README section 7) out of an
// axios error, falling back to a generic message for network-level failures.
const extractErrorMessage = (err) =>
  err.response?.data?.error || 'Something went wrong. Please try again.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the initial /auth/me check resolves

  useEffect(() => {
    axiosClient
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null)) // no/expired cookie — not logged in, not an error to surface
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const res = await axiosClient.post('/auth/register', payload);
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }, []);

  const logout = useCallback(async () => {
    await axiosClient.post('/auth/logout').catch(() => {}); // best-effort; clear local state regardless
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
