import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showLogout = router.pathname !== '/login';

  return (
    <div>
      {showLogout && (
        <button onClick={handleLogout}>Logout</button>
      )}
      {children}
    </div>
  );
}
