import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { disable2FA } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.POST('/auth/change-password', {
        body: { current_password: currentPassword, new_password: newPassword },
      });
      showToast('success', 'Passwort geändert');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      showToast('error', 'Passwortänderung fehlgeschlagen');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FA();
      showToast('success', '2FA deaktiviert');
    } catch (error) {
      console.error(error);
      showToast('error', '2FA konnte nicht deaktiviert werden');
    }
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
      <button onClick={handleDisable2FA}>2FA deaktivieren</button>
    </div>
  );
}
