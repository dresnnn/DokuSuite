import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, setChallenge } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data } = await apiClient.POST('/auth/login', {
      body: { email, password },
    });
    if (data?.access_token) {
      login(data.access_token);
    } else if (data?.challenge_token) {
      setChallenge(data.challenge_token);
      router.push('/2fa/verify');
    } else {
      setError('Login failed');
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
      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}
    </form>
  );
}
