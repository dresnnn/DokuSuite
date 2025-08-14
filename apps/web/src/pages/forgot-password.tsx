import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useToast } from '../components/Toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await apiClient.POST('/auth/reset-request', {
        body: { email },
      });
      if (error) {
        showToast('error', 'Reset failed');
      } else {
        showToast('success', 'Check your email');
        router.push('/login');
      }
    } catch {
      showToast('error', 'Reset failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send reset link</button>
    </form>
  );
}
