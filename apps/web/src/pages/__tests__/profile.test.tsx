import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../profile';
import { AuthProvider } from '../../context/AuthContext';
import { apiClient } from '../../../lib/api';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

describe('ProfilePage', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key]),
        setItem: jest.fn((key, value) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
      },
      writable: true,
    });
    mockedUseRouter.mockReturnValue({
      pathname: '/profile',
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
      beforePopState: jest.fn(),
    });
    jest.spyOn(apiClient, 'GET').mockResolvedValue({
      data: { id: 1, email: 'user@example.com', role: 'ADMIN' },
    } as unknown as Awaited<ReturnType<typeof apiClient.GET>>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('changes password', async () => {
    const post = jest
      .spyOn(apiClient, 'POST')
      .mockResolvedValue({} as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Aktuelles Passwort'), {
      target: { value: 'old' },
    });
    fireEvent.change(screen.getByPlaceholderText('Neues Passwort'), {
      target: { value: 'new' },
    });
    fireEvent.click(screen.getByText('Passwort ändern'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/change-password', {
        body: { current_password: 'old', new_password: 'new' },
      });
    });
  });

  it('disables 2FA and logs out', async () => {
    store['token'] = 'token123';
    const del = jest
      .spyOn(apiClient, 'DELETE')
      .mockResolvedValue({} as unknown as Awaited<ReturnType<typeof apiClient.DELETE>>);

    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('2FA deaktivieren'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/auth/2fa', {});
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
