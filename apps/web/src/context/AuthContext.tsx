import { createContext, useContext, useEffect, useState } from 'react';
import {
  apiClient,
  setAuthToken as storeToken,
  clearAuthToken,
} from '../../lib/api';

interface AuthContextValue {
  token: string | null;
  role: 'ADMIN' | 'USER' | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'USER' | null>(null);

  useEffect(() => {
    const existing = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (existing) {
      setToken(existing);
      apiClient.GET('/auth/me').then(({ data }) => {
        setRole(data?.role ?? null);
      });
    }
  }, []);

  const login = (newToken: string) => {
    storeToken(newToken);
    setToken(newToken);
    apiClient.GET('/auth/me').then(({ data }) => {
      setRole(data?.role ?? null);
    });
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

