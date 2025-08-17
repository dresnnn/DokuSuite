import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AcceptPage from '../accept/[token]';
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

describe('AcceptPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
    });
  });

  it('posts token and password', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ query: { token: 'tok1' }, push });
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(
      <ToastProvider>
        <AcceptPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/accept', {
        body: { token: 'tok1', password: 'pw' },
      });
      expect(push).toHaveBeenCalledWith('/login');
    });

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Password set. You can now log in.',
      ),
    );
  });

  it('shows error on failure', async () => {
    mockedUseRouter.mockReturnValue({ query: { token: 'tok1' } });
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(
      <ToastProvider>
        <AcceptPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Accept failed'),
    );
  });

  it('redirects on invalid token', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ query: { token: 'tok1' }, push });
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: { status: 404 } });

    render(
      <ToastProvider>
        <AcceptPage />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid token'),
    );
  });
});
