import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../login';
import { apiClient, setAuthToken, authFetch, onForbidden } from '../../../lib/api';
import { AuthProvider } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { AuthGuard } from '../_app';
import { useRouter } from 'next/router';
import { ToastProvider, useToast } from '../../components/Toast';
import { useEffect } from 'react';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

let store: Record<string, string> = {};
let replace: jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    store = {};
    replace = jest.fn();
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
      replace,
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

  function ForbiddenListener() {
    const { showToast } = useToast();
    useEffect(() => onForbidden(() => showToast('error', 'Access denied')), [showToast]);
    return null;
  }

  it('shows toast on 403 responses', async () => {
    const originalFetch = global.fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({
      status: 403,
    } as unknown as Response);

    render(
      <ToastProvider>
        <ForbiddenListener />
      </ToastProvider>,
    );

    try {
      await authFetch('/api/test');
    } catch {}

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });

    (global as any).fetch = originalFetch;
  });

  it('stores token and redirects on successful login', async () => {
    jest.spyOn(apiClient, 'POST').mockResolvedValue(
      {
        data: {
          access_token: 'token123',
        },
      } as unknown as Awaited<ReturnType<typeof apiClient.POST>>,
    );

    render(
      <AuthProvider>
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
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
      expect(replace).toHaveBeenCalledWith('/photos');
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
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
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
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
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

    it('clears token and redirects to login on 401 responses', async () => {
      setAuthToken('token123');

      const fetchMock = jest.fn().mockResolvedValue({ status: 401 });
      const originalFetch = global.fetch;
      // @ts-expect-error replace fetch for test
      global.fetch = fetchMock;

      await authFetch('/api/photos');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

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
          <ToastProvider>
            <AuthGuard>
              <div>public</div>
            </AuthGuard>
          </ToastProvider>
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
          <ToastProvider>
            <AuthGuard>
              <div>protected</div>
            </AuthGuard>
          </ToastProvider>
        </AuthProvider>,
      );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });
  });

  it.each(['/users', '/shares', '/locations', '/customers'])(
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
          <ToastProvider>
            <AuthGuard>
              <div>admin</div>
            </AuthGuard>
          </ToastProvider>
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith('/photos');
      });
    },
  );

  it('renders customers link in navigation for admin users', async () => {
    store['token'] = 'token123';
    (apiClient.GET as jest.Mock).mockResolvedValueOnce({
      data: { id: 1, email: 'admin@example.com', role: 'ADMIN' },
    } as unknown as Awaited<ReturnType<typeof apiClient.GET>>);
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

    await waitFor(() => {
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });
  });

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

  it('hides admin links for non-admin users', async () => {
    store['token'] = 'token123';
    (apiClient.GET as jest.Mock).mockResolvedValueOnce({
      data: { id: 1, email: 'user@example.com', role: 'USER' },
    } as unknown as Awaited<ReturnType<typeof apiClient.GET>>);
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

    await waitFor(() => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Shares')).not.toBeInTheDocument();
    expect(screen.queryByText('Locations')).not.toBeInTheDocument();
    expect(screen.queryByText('Customers')).not.toBeInTheDocument();
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
