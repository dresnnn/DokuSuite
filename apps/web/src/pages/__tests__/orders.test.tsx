import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import OrdersPage from '../orders'
import OrderDetailPage from '../orders/[id]'
import { apiClient } from '../../../lib/api'
import { ToastProvider } from '../../components/Toast'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn(), PATCH: jest.fn() },
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' } }),
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

    render(
      <ToastProvider>
        <OrdersPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('o1')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/orders/1',
    )

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

    render(
      <ToastProvider>
        <OrdersPage />
      </ToastProvider>,
    )

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

  it('shows toast on create order error', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: undefined })

    render(
      <ToastProvider>
        <OrdersPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('Customer ID'), {
      target: { value: 'c1' },
    })
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Order 1' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to create order',
      )
    })
  })
})

describe('OrderDetailPage', () => {
  it('updates order', async () => {
    jest.clearAllMocks()
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { customer_id: 'c1', name: 'Order 1', status: 'reserved' },
    })

    render(<OrderDetailPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('Status:'), {
      target: { value: 'booked' },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() =>
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/orders/{id}',
        expect.objectContaining({
          params: { path: { id: 1 } },
          body: expect.objectContaining({ status: 'booked' }),
        }),
      ),
    )
  })
})
