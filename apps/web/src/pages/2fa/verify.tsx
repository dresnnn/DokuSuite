import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function TwoFAVerifyPage() {
  const { challenge, login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!challenge) {
      router.replace('/login');
    }
  }, [challenge, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    try {
      const { data } = await apiClient.POST('/auth/2fa/verify', {
        body: { challenge, token },
      });
      if (data?.access_token) {
        login(data.access_token);
        showToast('success', '2FA verification successful');
        router.replace('/photos');
      } else {
        showToast('error', 'Verification failed');
      }
    } catch {
      showToast('error', 'Verification failed');
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
    </form>
  );
}
