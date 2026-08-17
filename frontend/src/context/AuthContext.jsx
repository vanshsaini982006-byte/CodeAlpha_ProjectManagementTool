import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/resources';
import { getErrorMessage, getStoredToken, getStoredUser, clearStoredSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        setUser(data.user);
        // Refresh the cached copy in whichever storage already holds the session.
        const store = localStorage.getItem('taskflow_token') ? localStorage : sessionStorage;
        store.setItem('taskflow_user', JSON.stringify(data.user));
      } catch (err) {
        clearStoredSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSession = (data, remember = true) => {
    clearStoredSession();
    const store = remember ? localStorage : sessionStorage;
    store.setItem('taskflow_token', data.token);
    store.setItem('taskflow_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = useCallback(async (email, password, remember = true) => {
    try {
      const { data } = await authApi.login({ email, password });
      persistSession(data, remember);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await authApi.register(payload);
      persistSession(data, true);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    const store = localStorage.getItem('taskflow_token') ? localStorage : sessionStorage;
    store.setItem('taskflow_user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
