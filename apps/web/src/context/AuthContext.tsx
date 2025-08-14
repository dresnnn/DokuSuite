import { createContext, useContext, useEffect, useState } from 'react';
import {
  apiClient,
  setAuthToken as storeToken,
  clearAuthToken,
} from '../../lib/api';

interface AuthContextValue {
  token: string | null;
  role: 'ADMIN' | 'USER' | null;
  userId: number | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  challenge: string | null;
  setChallenge: (token: string | null) => void;
  disable2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'USER' | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);

  useEffect(() => {
    const existing = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (existing) {
      setToken(existing);
      apiClient.GET('/auth/me').then(({ data }) => {
        setRole(data?.role ?? null);
        setUserId(data?.id ?? null);
      });
    }
  }, []);

  const login = (newToken: string) => {
    storeToken(newToken);
    setToken(newToken);
    setChallenge(null);
    apiClient.GET('/auth/me').then(({ data }) => {
      setRole(data?.role ?? null);
      setUserId(data?.id ?? null);
    });
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setRole(null);
    setUserId(null);
    setChallenge(null);
  };

  const disable2FA = async () => {
    await apiClient.DELETE('/auth/2fa', {});
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        userId,
        login,
        logout,
        isAuthenticated: !!token,
        challenge,
        setChallenge,
        disable2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

