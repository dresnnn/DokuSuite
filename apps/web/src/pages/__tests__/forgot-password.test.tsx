import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '../forgot-password';
import { apiClient } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({
  apiClient: { POST: jest.fn() },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows confirmation on success', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/reset-request', {
        body: { email: 'user@example.com' },
      });
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Reset failed');
    });
  });
});
