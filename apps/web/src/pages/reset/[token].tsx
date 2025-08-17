import { useRouter } from 'next/router';
import { useState } from 'react';
import { apiClient } from '../../../lib/api';
import { useToast } from '../../components/Toast';

export default function ResetPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || Array.isArray(token)) return;
    const { error } = await apiClient.POST('/auth/reset', {
      body: { token, password },
    });
    if (error) {
      if (error.status === 404) {
        showToast('error', 'Invalid token');
        router.replace('/login');
      } else {
        showToast('error', 'Reset failed');
      }
    } else {
      showToast('success', 'Password reset. You can now log in.');
      router.replace('/login');
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
      <button type="submit">Reset Password</button>
    </form>
  );
}
