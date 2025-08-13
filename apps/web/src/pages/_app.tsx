import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && router.pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </AuthProvider>
  );
}

