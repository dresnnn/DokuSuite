import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../login';
import { apiClient, setAuthToken, authFetch } from '../../../lib/api';
import { AuthProvider } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { AuthGuard } from '../_app';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

let store: Record<string, string> = {};

describe('LoginPage', () => {
  beforeEach(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn((key, value) => {
          store[key] = value;
        }),
        getItem: jest.fn((key) => store[key]),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
      },
      writable: true,
    });
    mockedUseRouter.mockReturnValue({
      pathname: '/login',
      replace: jest.fn(),
      push: jest.fn(),
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

  it('stores token on successful login', async () => {
    jest.spyOn(apiClient, 'POST').mockResolvedValue(
      {
        data: {
          access_token: 'token123',
        },
      } as unknown as Awaited<ReturnType<typeof apiClient.POST>>,
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'token123');
    });
  });

  it('redirects to 2fa verification when challenge returned', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({
      pathname: '/login',
      replace: jest.fn(),
      push,
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
      beforePopState: jest.fn(),
    });

    jest.spyOn(apiClient, 'POST').mockResolvedValue({
      data: { challenge_token: 'abc' },
    } as unknown as Awaited<ReturnType<typeof apiClient.POST>>);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/2fa/verify');
    });
  });

  it('shows error on failed login', async () => {
    jest
      .spyOn(apiClient, 'POST')
      .mockResolvedValue(
        { data: undefined, error: {} } as unknown as Awaited<
          ReturnType<typeof apiClient.POST>
        >,
      );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
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

    it('adds auth header to subsequent requests after login', async () => {
      setAuthToken('token123');

      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      const originalFetch = global.fetch;
      // @ts-expect-error replace fetch for test
      global.fetch = fetchMock;

      await authFetch('/api/photos');

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/photos');
      expect((options.headers as Headers).get('Authorization')).toBe(
        'Bearer token123',
      );

      global.fetch = originalFetch;
    });

    it('does not redirect unauthenticated users on public routes', async () => {
      const replace = jest.fn();
      mockedUseRouter.mockReturnValue({
        pathname: '/public/info',
        replace,
        push: jest.fn(),
        prefetch: jest.fn(),
        events: { on: jest.fn(), off: jest.fn() },
        beforePopState: jest.fn(),
      });

      render(
        <AuthProvider>
          <AuthGuard>
            <div>public</div>
          </AuthGuard>
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(replace).not.toHaveBeenCalled();
      });
    });

    it('redirects unauthenticated users to /login', async () => {
      const replace = jest.fn();
      mockedUseRouter.mockReturnValue({
        pathname: '/photos',
        replace,
        push: jest.fn(),
        prefetch: jest.fn(),
        events: { on: jest.fn(), off: jest.fn() },
        beforePopState: jest.fn(),
      });

      render(
        <AuthProvider>
          <AuthGuard>
            <div>protected</div>
          </AuthGuard>
        </AuthProvider>,
      );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });

  it.each(['/users', '/shares', '/locations'])(
    'redirects normal users from %s',
    async (path) => {
      store['token'] = 'token123';
      (apiClient.GET as jest.Mock).mockResolvedValueOnce({
        data: { id: 1, email: 'user@example.com', role: 'USER' },
      } as unknown as Awaited<ReturnType<typeof apiClient.GET>>);

      const replace = jest.fn();
      mockedUseRouter.mockReturnValue({
        pathname: path,
        replace,
        push: jest.fn(),
        prefetch: jest.fn(),
        events: { on: jest.fn(), off: jest.fn() },
        beforePopState: jest.fn(),
      });

      render(
        <AuthProvider>
          <AuthGuard>
            <div>admin</div>
          </AuthGuard>
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith('/photos');
      });
    },
  );

  it('clears token and redirects to login on logout', () => {
    store['token'] = 'token123';
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({
      pathname: '/photos',
      replace: push,
      push,
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
      beforePopState: jest.fn(),
    });

    render(
      <AuthProvider>
        <Layout>
          <div>content</div>
        </Layout>
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('Logout'));
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(push).toHaveBeenCalledWith('/login');
  });

    it('renders exports link in navigation', () => {
      store['token'] = 'token123';
      const push = jest.fn();
      mockedUseRouter.mockReturnValue({
        pathname: '/photos',
        replace: push,
        push,
        prefetch: jest.fn(),
        events: { on: jest.fn(), off: jest.fn() },
        beforePopState: jest.fn(),
      });

      render(
        <AuthProvider>
          <Layout>
            <div>content</div>
          </Layout>
        </AuthProvider>,
      );

      expect(screen.getByText('Exports')).toBeInTheDocument();
    });

    it('does not render navigation links when unauthenticated', () => {
      const push = jest.fn();
      mockedUseRouter.mockReturnValue({
        pathname: '/photos',
        replace: push,
        push,
        prefetch: jest.fn(),
        events: { on: jest.fn(), off: jest.fn() },
        beforePopState: jest.fn(),
      });

      render(
        <AuthProvider>
          <Layout>
            <div>content</div>
          </Layout>
        </AuthProvider>,
      );

      expect(screen.queryByText('Photos')).not.toBeInTheDocument();
      expect(screen.queryByText('Exports')).not.toBeInTheDocument();
    });
  });
