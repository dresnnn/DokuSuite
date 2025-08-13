import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../login';
import { apiClient } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({
  apiClient: { POST: jest.fn() },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: jest.fn() },
      writable: true,
    });
  });

  it('stores token on successful login', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({
      data: {
        access_token: 'token123',
      },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'token',
        'token123',
      );
    });
  });

  it('shows error on failed login', async () => {
    (apiClient.POST as jest.Mock).mockResolvedValue({ data: undefined, error: {} });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Login failed');
    });
  });
});
