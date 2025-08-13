import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResetPage from '../reset/[token]';
import { apiClient } from '../../../lib/api';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../lib/api', () => ({
  apiClient: { POST: jest.fn() },
}));

const mockedUseRouter = useRouter as jest.Mock;

describe('ResetPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
    });
  });

  it('posts token and password', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(<ResetPage />);

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Reset Password'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/reset', {
        body: { token: 'tok1', password: 'pw' },
      });
      expect(
        screen.getByText('Password reset. You can now log in.'),
      ).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(<ResetPage />);

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Reset Password'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Reset failed');
    });
  });
});
