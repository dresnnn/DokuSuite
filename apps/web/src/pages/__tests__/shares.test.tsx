import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SharesPage from '../shares'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn(), DELETE: jest.fn() },
}))

describe('SharesPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists and creates shares and shows URL', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: [{ id: 1, order_id: 2, url: 'http://u1' }],
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 2, order_id: 3, url: 'http://u2' },
    })

    render(<SharesPage />)

    await waitFor(() => {
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Order ID'), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'a@b.c' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/shares', {
        body: { order_id: 3, email: 'a@b.c', download_allowed: true },
      })
      expect(screen.getByText('http://u2')).toBeInTheDocument()
    })
  })

  it('revokes share', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: [{ id: 1, order_id: 2, url: 'http://u1' }],
    })

    render(<SharesPage />)

    await waitFor(() => {
      expect(screen.getByText('http://u1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Revoke'))

    await waitFor(() => {
      expect(apiClient.DELETE).toHaveBeenCalledWith('/shares/{id}', {
        params: { path: { id: 1 } },
      })
      expect(screen.queryByText('http://u1')).not.toBeInTheDocument()
    })
  })
})
