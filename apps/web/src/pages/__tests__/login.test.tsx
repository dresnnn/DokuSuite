import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../login';
import { apiClient, setAuthToken, authFetch } from '../../../lib/api';

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

    render(<LoginPage />);
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

  it('shows error on failed login', async () => {
    jest
      .spyOn(apiClient, 'POST')
      .mockResolvedValue(
        { data: undefined, error: {} } as unknown as Awaited<
          ReturnType<typeof apiClient.POST>
        >,
      );

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
});
