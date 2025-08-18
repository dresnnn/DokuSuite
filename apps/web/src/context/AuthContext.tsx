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
  const [challenge, setChallengeState] = useState<string | null>(null);

  const setChallenge = (value: string | null) => {
    if (typeof window !== 'undefined') {
      if (value) sessionStorage.setItem('challenge', value);
      else sessionStorage.removeItem('challenge');
    }
    setChallengeState(value);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('token');
      const storedChallenge = sessionStorage.getItem('challenge');
      if (existing) {
        setToken(existing);
        apiClient.GET('/auth/me').then(({ data }) => {
          setRole(data?.role ?? null);
          setUserId(data?.id ?? null);
        });
      }
      if (storedChallenge) {
        setChallengeState(storedChallenge);
      }
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
    const { error } = await apiClient.DELETE('/auth/2fa', {});
    if (error) throw error;
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

