import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const adminPaths = ['/users', '/shares', '/locations'];
    if (!isAuthenticated && router.pathname !== '/login') {
      router.replace('/login');
    } else if (
      isAuthenticated &&
      role &&
      adminPaths.some((p) => router.pathname.startsWith(p)) &&
      role !== 'ADMIN'
    ) {
      router.replace('/photos');
    }
  }, [isAuthenticated, role, router]);

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

