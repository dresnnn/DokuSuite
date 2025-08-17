import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResetPage from '../reset/[token]';
import { apiClient } from '../../../lib/api';
import { useRouter } from 'next/router';
import { ToastProvider } from '../../components/Toast';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../lib/api', () => ({
  apiClient: { POST: jest.fn() },
}));

const mockedUseRouter = useRouter as jest.Mock;

let replace: jest.Mock;

describe('ResetPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    replace = jest.fn();
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
      replace,
    });
  });

  it('posts token and password', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(
      <ToastProvider>
        <ResetPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Reset Password'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/reset', {
        body: { token: 'tok1', password: 'pw' },
      });
      expect(replace).toHaveBeenCalledWith('/login');
    });
    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Password reset. You can now log in.');
  });

  it('shows error toast on failure', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(
      <ToastProvider>
        <ResetPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Reset Password'));

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Reset failed');
  });

  it('redirects on invalid token and shows toast', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: { status: 404 } });

    render(
      <ToastProvider>
        <ResetPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Reset Password'));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Invalid token');
  });
});
