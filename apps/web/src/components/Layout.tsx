import Link from 'next/link';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showNav = isAuthenticated && router.pathname !== '/login';

  return (
    <div className="app-container">
      {showNav && (
        <nav className="navbar">
          <div className="nav-links">
            <Link href="/photos">Photos</Link>
            {role === 'ADMIN' && <Link href="/users">Users</Link>}
            <Link href="/orders">Orders</Link>
            {role === 'ADMIN' && <Link href="/shares">Shares</Link>}
            {role === 'ADMIN' && <Link href="/locations">Locations</Link>}
            <Link href="/exports">Exports</Link>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      )}
      <main className="main-content">{children}</main>
    </div>
  );
}
