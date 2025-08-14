import { useRouter } from 'next/router';
import { useState } from 'react';
import { apiClient } from '../../../lib/api';
import { useToast } from '../../components/Toast';

export default function AcceptPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || Array.isArray(token)) return;
    try {
      const { error } = await apiClient.POST('/auth/accept', {
        body: { token, password },
      });
      if (error) {
        showToast('error', 'Accept failed');
      } else {
        showToast('success', 'Password set. You can now log in.');
        router.push('/login');
      }
    } catch {
      showToast('error', 'Accept failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Set Password</button>
    </form>
  );
}
