import { createContext, useContext, useState, useCallback } from 'react';
import { verifyAdminToken } from '../services/adminApi.js';

const STORAGE_KEY = 'javablocks_professor_token';
const ProfessorAuthContext = createContext(null);

export function ProfessorAuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');

  const login = useCallback(async (candidateToken) => {
    const result = await verifyAdminToken(candidateToken);
    if (result.ok) {
      sessionStorage.setItem(STORAGE_KEY, candidateToken);
      setToken(candidateToken);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken('');
  }, []);

  const value = { token, isAuthenticated: Boolean(token), login, logout };
  return <ProfessorAuthContext.Provider value={value}>{children}</ProfessorAuthContext.Provider>;
}

export function useProfessorAuth() {
  const ctx = useContext(ProfessorAuthContext);
  if (!ctx) throw new Error('useProfessorAuth must be used within a ProfessorAuthProvider');
  return ctx;
}
