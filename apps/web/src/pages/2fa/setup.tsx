import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '../../lib/api';

export default function TwoFASetupPage() {
  const [info, setInfo] = useState<{ secret?: string; qr_code?: string } | null>(null);

  const handleSetup = async () => {
    const { data } = await apiClient.POST('/auth/2fa/setup', {});
    setInfo(data ?? null);
  };

  return (
    <div>
      <button onClick={handleSetup}>Generate 2FA Secret</button>
      {info && (
        <div>
          {info.secret && <p>Secret: {info.secret}</p>}
          {info.qr_code && (
            <Image src={info.qr_code} alt="QR code" width={200} height={200} />
          )}
        </div>
      )}
    </div>
  );
}
