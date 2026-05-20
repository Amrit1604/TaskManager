/**
 * context/AuthContext.jsx
 * Global auth state — provides user info and login/logout/signup helpers.
 * On mount, fetches /auth/me to restore session from existing cookie.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until /me resolves

  // Restore session on app load
  useEffect(() => {
    authAPI.me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Listen for 401 (session expired) from axios interceptor
  useEffect(() => {
    const handler = () => { setUser(null); toast.error('Session expired. Please log in.'); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authAPI.signup(data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
