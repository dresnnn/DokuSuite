import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TwoFAVerifyPage from '../2fa/verify';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import { ToastProvider } from '../../components/Toast';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock(
  '../../lib/api',
  () => ({
    apiClient: { POST: jest.fn() },
  }),
  { virtual: true },
);

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe('TwoFAVerifyPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows success toast and navigates on success', async () => {
    const replace = jest.fn();
    const login = jest.fn();

    mockedUseRouter.mockReturnValue({
      pathname: '/2fa/verify',
      replace,
      push: jest.fn(),
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
      beforePopState: jest.fn(),
    });

    mockedUseAuth.mockReturnValue({
      challenge: 'challenge123',
      login,
    });

    (apiClient.POST as jest.Mock).mockResolvedValue({
      data: { access_token: 'token123' },
    } as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(
      <ToastProvider>
        <TwoFAVerifyPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Token'), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/2fa/verify', {
        body: { challenge: 'challenge123', token: '654321' },
      });
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('token123');
      expect(replace).toHaveBeenCalledWith('/photos');
    });
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '2FA verification successful',
      ),
    );
  });

  it('shows error toast on failure', async () => {
    const replace = jest.fn();
    const login = jest.fn();

    mockedUseRouter.mockReturnValue({
      pathname: '/2fa/verify',
      replace,
      push: jest.fn(),
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
      beforePopState: jest.fn(),
    });

    mockedUseAuth.mockReturnValue({
      challenge: 'challenge123',
      login,
    });

    (apiClient.POST as jest.Mock).mockResolvedValue({
      data: {},
    } as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(
      <ToastProvider>
        <TwoFAVerifyPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Token'), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/2fa/verify', {
        body: { challenge: 'challenge123', token: '654321' },
      });
    });

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Verification failed'),
    );
    expect(login).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
