import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, setChallenge } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await apiClient.POST('/auth/login', {
        body: { email, password },
      });
      if (data?.access_token) {
        login(data.access_token);
        router.replace('/photos');
        showToast('success', 'Login successful');
      } else if (data?.challenge_token) {
        setChallenge(data.challenge_token);
        router.push('/2fa/verify');
      } else {
        showToast('error', 'Login failed');
      }
    } catch {
      showToast('error', 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
