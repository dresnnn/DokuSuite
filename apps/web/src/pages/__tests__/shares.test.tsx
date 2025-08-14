import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SharesPage from '../shares'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

describe('SharesPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists and creates shares and shows URL', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: {
        items: [{ id: 1, order_id: 2, url: 'http://u1' }],
        meta: { page: 1, limit: 10, total: 1 },
      },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 2, order_id: 3, url: 'http://u2' },
    })

    render(<SharesPage />)

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/shares', {
        params: { query: { page: 1, limit: 10 } },
      })
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Order ID'), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'a@b.c' },
    })
    fireEvent.change(screen.getByPlaceholderText('Expires At'), {
      target: { value: '2024-01-01T00:00' },
    })
    fireEvent.change(screen.getByLabelText('Watermark Policy'), {
      target: { value: 'default' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/shares', {
        body: {
          order_id: 3,
          email: 'a@b.c',
          download_allowed: true,
          expires_at: '2024-01-01T00:00',
          watermark_policy: 'default',
        },
      })
      expect(screen.getByText('http://u2')).toBeInTheDocument()
    })
  })

  it('revokes share', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: {
        items: [{ id: 1, order_id: 2, url: 'http://u1' }],
        meta: { page: 1, limit: 10, total: 1 },
      },
    })

    render(<SharesPage />)

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/shares', {
        params: { query: { page: 1, limit: 10 } },
      })
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Revoke'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/shares/{id}/revoke', {
        params: { path: { id: 1 } },
      })
      expect(screen.queryByText('http://u1')).not.toBeInTheDocument()
    })
  })

  it('navigates pages with Prev/Next', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, order_id: 2, url: 'http://u1' }],
          meta: { page: 1, limit: 10, total: 20 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 2, order_id: 3, url: 'http://u2' }],
          meta: { page: 2, limit: 10, total: 20 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, order_id: 2, url: 'http://u1' }],
          meta: { page: 1, limit: 10, total: 20 },
        },
      })

    render(<SharesPage />)

    await waitFor(() => {
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenLastCalledWith('/shares', {
        params: { query: { page: 2, limit: 10 } },
      })
      expect(screen.getByText('http://u2')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Prev'))

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenLastCalledWith('/shares', {
        params: { query: { page: 1, limit: 10 } },
      })
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })
  })
})
