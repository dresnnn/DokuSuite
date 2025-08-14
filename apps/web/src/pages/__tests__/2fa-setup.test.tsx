import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TwoFASetupPage from '../2fa/setup';
import React from 'react';
import { apiClient } from '../../lib/api';

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

  it('generates and displays secret and QR code', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({
      data: { secret: 'abc123', qr_code: '/qr.png' },
    } as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(<TwoFASetupPage />);
    fireEvent.click(screen.getByText('Generate 2FA Secret'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/2fa/setup', {});
    });

    expect(await screen.findByText('Secret: abc123')).toBeInTheDocument();
    expect(await screen.findByAltText('QR code')).toBeInTheDocument();
  });
});
