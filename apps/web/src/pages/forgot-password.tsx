import { useState } from 'react';
import { apiClient } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { error: err } = await apiClient.POST('/auth/reset-request', {
      body: { email },
    });
    if (err) {
      setError('Reset failed');
    } else {
      setMessage('Check your email');
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
      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}
      {message && <div role="status">{message}</div>}
    </form>
  );
}
