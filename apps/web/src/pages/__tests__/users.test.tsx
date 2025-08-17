import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import UsersPage from '../users'
import { apiClient } from '../../../lib/api'
import { ToastProvider } from '../../components/Toast'

jest.mock('../../../lib/api', () => ({
  apiClient: {
    GET: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
    POST: jest.fn(),
  },
}))

describe('UsersPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders users and updates role', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: {
        items: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
        meta: { page: 1, limit: 10, total: 1 },
      },
    })
    ;(apiClient.PATCH as jest.Mock).mockResolvedValue({ data: {} })

    render(
      <ToastProvider>
        <UsersPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('u1@example.com')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByDisplayValue('USER'), {
      target: { value: 'ADMIN' },
    })

    await waitFor(() => {
      expect(apiClient.PATCH).toHaveBeenCalledWith('/users/{id}', {
        params: { path: { id: 1 } },
        body: { role: 'ADMIN' },
      })
    })
  })

  it('deletes user', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: {
        items: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
        meta: { page: 1, limit: 10, total: 1 },
      },
    })
    ;(apiClient.DELETE as jest.Mock).mockResolvedValue({})

    render(
      <ToastProvider>
        <UsersPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('u1@example.com')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(apiClient.DELETE).toHaveBeenCalledWith('/users/{id}', {
        params: { path: { id: 1 } },
      })
      expect(screen.queryByText('u1@example.com')).not.toBeInTheDocument()
    })
  })

  it('invites user', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: {} })

    render(
      <ToastProvider>
        <UsersPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.click(screen.getByText('Invite'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/invite', {
        body: { email: 'new@example.com' },
      })
      expect(screen.getByPlaceholderText('Email')).toHaveValue('')
    })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invite sent'),
    )
  })

  it('shows toast on invite error', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ error: 'oops' })

    render(
      <ToastProvider>
        <UsersPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'err@example.com' },
    })
    fireEvent.click(screen.getByText('Invite'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invite failed'),
    )
  })

  it('navigates pages', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
          meta: { page: 1, limit: 10, total: 20 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 2, email: 'u2@example.com', role: 'USER' }],
          meta: { page: 2, limit: 10, total: 20 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
          meta: { page: 1, limit: 10, total: 20 },
        },
      })

    render(
      <ToastProvider>
        <UsersPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('u1@example.com')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('u2@example.com')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Prev'))

    await waitFor(() => {
      expect(screen.getByText('u1@example.com')).toBeInTheDocument()
    })

    expect(apiClient.GET).toHaveBeenNthCalledWith(1, '/users', {
      params: { query: { page: 1, limit: 10 } },
    })
    expect(apiClient.GET).toHaveBeenNthCalledWith(2, '/users', {
      params: { query: { page: 2, limit: 10 } },
    })
    expect(apiClient.GET).toHaveBeenNthCalledWith(3, '/users', {
      params: { query: { page: 1, limit: 10 } },
    })
  })
})
