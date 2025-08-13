import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import OrdersPage from '../orders'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

describe('OrdersPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists orders, filters and paginates', async () => {
    const page1 = {
      items: [{ id: 1, name: 'o1', status: 'reserved', customer_id: 'c1' }],
      meta: { page: 1, limit: 1, total: 2 },
    }
    const page2 = {
      items: [{ id: 2, name: 'o2', status: 'booked', customer_id: 'c2' }],
      meta: { page: 2, limit: 1, total: 2 },
    }
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 })
      .mockResolvedValue({ data: page1 })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('o1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText('o2')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Customer ID:'), {
      target: { value: 'c1' },
    })
    fireEvent.change(screen.getByLabelText('Status:'), {
      target: { value: 'booked' },
    })
    fireEvent.click(screen.getByText('Fetch'))

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenLastCalledWith(
        '/orders',
        expect.objectContaining({
          params: {
            query: expect.objectContaining({
              customerId: 'c1',
              status: 'booked',
            }),
          },
        }),
      )
    })
  })

  it('creates order', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: { id: 1 } })

    render(<OrdersPage />)

    fireEvent.change(screen.getByPlaceholderText('Customer ID'), {
      target: { value: 'c1' },
    })
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Order 1' },
    })
    fireEvent.change(screen.getByDisplayValue('reserved'), {
      target: { value: 'booked' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/orders', {
        body: { customer_id: 'c1', name: 'Order 1', status: 'booked' },
      })
    })

    expect(screen.getByPlaceholderText('Customer ID')).toHaveValue('')
    expect(screen.getByPlaceholderText('Name')).toHaveValue('')
  })
})
