import Link from 'next/link';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showNav = isAuthenticated && router.pathname !== '/login';

  return (
    <div>
      {showNav && (
        <nav>
          <Link href="/photos">Photos</Link> |{' '}
          <Link href="/users">Users</Link> |{' '}
          <Link href="/orders">Orders</Link> |{' '}
          <Link href="/shares">Shares</Link> |{' '}
          <Link href="/exports">Exports</Link> |{' '}
          <button onClick={handleLogout}>Logout</button>
        </nav>
      )}
      {children}
    </div>
  );
}
