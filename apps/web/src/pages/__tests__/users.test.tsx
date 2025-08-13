import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import UsersPage from '../users'
import { apiClient } from '../../../lib/api'

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
      data: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
    })
    ;(apiClient.PATCH as jest.Mock).mockResolvedValue({ data: {} })

    render(<UsersPage />)

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
      data: [{ id: 1, email: 'u1@example.com', role: 'USER' }],
    })
    ;(apiClient.DELETE as jest.Mock).mockResolvedValue({})

    render(<UsersPage />)

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
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: [] })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: {} })

    render(<UsersPage />)

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
  })
})
