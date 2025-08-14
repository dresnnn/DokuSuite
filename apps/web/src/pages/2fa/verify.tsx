import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function TwoFAVerifyPage() {
  const { challenge, login } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challenge) {
      router.replace('/login');
    }
  }, [challenge, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    const { data } = await apiClient.POST('/auth/2fa/verify', {
      body: { challenge, token },
    });
    if (data?.access_token) {
      login(data.access_token);
      router.replace('/');
    } else {
      setError('Verification failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button type="submit">Verify</button>
      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}
    </form>
  );
}
