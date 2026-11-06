import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, AUTH_EXPIRED_EVENT } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((reason = '') => {
    setUser(null);
    setToken(null);
    setSessionMessage(reason);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setSessionMessage('');
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // Validate the stored token once on startup.
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) return;
    apiFetch('/auth/me', stored)
      .then(({ user: fresh }) => {
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      })
      .catch((err) => {
        // Keep the cached session if the server is simply unreachable (offline PWA).
        if (err.status) logout('Your session has expired. Please sign in again.');
      })
      .finally(() => setLoading(false));
  }, [logout]);

  // Any request that comes back 401 logs the user out.
  useEffect(() => {
    const onExpired = (e) => logout(e.detail || 'Your session has expired. Please sign in again.');
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, login, logout, loading, sessionMessage }),
    [user, token, login, logout, loading, sessionMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
