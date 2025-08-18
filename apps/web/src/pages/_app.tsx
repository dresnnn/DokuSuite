import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ToastProvider, useToast } from '../components/Toast';
import { onForbidden } from '../../lib/api';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset',
  '/accept',
  '/public',
  '/2fa/verify',
];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const adminPaths = ['/users', '/shares', '/locations', '/customers'];
    const isPublicPath = publicPaths.some((p) =>
      router.pathname.startsWith(p),
    );

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login');
      showToast('error', 'Please log in');
    } else if (
      isAuthenticated &&
      role &&
      adminPaths.some((p) => router.pathname.startsWith(p)) &&
      role !== 'ADMIN'
    ) {
      router.replace('/photos');
      showToast('error', 'Access denied');
    }
  }, [isAuthenticated, role, router, showToast]);

  useEffect(() => onForbidden(() => showToast('error', 'Access denied')), [showToast]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}

