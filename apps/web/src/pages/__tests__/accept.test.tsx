import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AcceptPage from '../accept/[token]';
import { apiClient } from '../../../lib/api';
import { useRouter } from 'next/router';

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
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: undefined });

    render(<AcceptPage />);

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/accept', {
        body: { token: 'tok1', password: 'pw' },
      });
      expect(
        screen.getByText('Password set. You can now log in.'),
      ).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ error: {} });

    render(<AcceptPage />);

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Accept failed');
    });
  });
});
