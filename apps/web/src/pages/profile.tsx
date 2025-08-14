import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { disable2FA } = useAuth();
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.POST('/auth/change-password', {
      body: { current_password: currentPassword, new_password: newPassword },
    });
    setMessage('Passwort geändert');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div>
      <h1>Profil</h1>
      <form onSubmit={handlePasswordChange}>
        <input
          type="password"
          placeholder="Aktuelles Passwort"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Neues Passwort"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit">Passwort ändern</button>
      </form>
      <button onClick={() => router.push('/2fa/setup')}>2FA aktivieren</button>
      <button onClick={() => disable2FA()}>2FA deaktivieren</button>
      {message && <p>{message}</p>}
    </div>
  );
}
