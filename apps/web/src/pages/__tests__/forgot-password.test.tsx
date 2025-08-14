import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '../forgot-password';
import { apiClient } from '../../../lib/api';
import { ToastProvider } from '../../components/Toast';
import { useRouter } from 'next/router';

jest.mock('../../../lib/api', () => ({
  apiClient: { POST: jest.fn() },
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows confirmation on success', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ push });
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(
      <ToastProvider>
        <ForgotPasswordPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/reset-request', {
        body: { email: 'user@example.com' },
      });
      expect(push).toHaveBeenCalledWith('/login');
    });

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Check your email'),
    );
  });

  it('shows error on failure', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() });
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(
      <ToastProvider>
        <ForgotPasswordPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Reset failed'),
    );
  });
});
