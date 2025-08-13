import { useState } from 'react';
import { apiClient, setAuthToken } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data } = await apiClient.POST('/auth/login', {
      body: { email, password },
    });
    if (data) {
      setAuthToken(data.access_token);
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
