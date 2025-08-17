import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TwoFASetupPage from '../2fa/setup';
import React from 'react';
import { apiClient } from '../../lib/api';
import { ToastProvider } from '../../components/Toast';

jest.mock(
  '../../lib/api',
  () => ({
    apiClient: { POST: jest.fn() },
  }),
  { virtual: true },
);

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('TwoFASetupPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows toast and displays secret and QR code on success', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({
      data: { secret: 'abc123', qr_code: '/qr.png' },
    } as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(
      <ToastProvider>
        <TwoFASetupPage />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('Generate 2FA Secret'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/2fa/setup', {});
    });

    expect(await screen.findByText('Secret: abc123')).toBeInTheDocument();
    expect(await screen.findByAltText('QR code')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('2FA secret generated'),
    );
  });

  it('shows error toast on failure', async () => {
    (apiClient.POST as jest.Mock).mockRejectedValue(new Error('error'));

    render(
      <ToastProvider>
        <TwoFASetupPage />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Generate 2FA Secret'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/2fa/setup', {});
    });

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to generate 2FA secret',
      ),
    );
    expect(screen.queryByText(/Secret:/)).not.toBeInTheDocument();
  });
});
