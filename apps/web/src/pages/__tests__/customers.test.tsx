import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CustomersPage from '../customers'
import { apiClient } from '../../../lib/api'
import { ToastProvider } from '../../components/Toast'

jest.mock('../../../lib/api', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
  },
}))

describe('CustomersPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists customers and paginates', async () => {
    const page1 = {
      items: [
        { id: 1, name: 'c1', watermark_policy: 'none', watermark_text: null },
      ],
      meta: { page: 1, limit: 1, total: 2 },
    }
    const page2 = {
      items: [
        { id: 2, name: 'c2', watermark_policy: 'default', watermark_text: 'w' },
      ],
      meta: { page: 2, limit: 1, total: 2 },
    }
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 })
      .mockResolvedValue({ data: page1 })

    render(
      <ToastProvider>
        <CustomersPage />
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('c1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByDisplayValue('c2')).toBeInTheDocument()
    })
  })

  it('creates customer', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: { id: 1 } })

    render(
      <ToastProvider>
        <CustomersPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Cust' },
    })
    fireEvent.change(screen.getByDisplayValue('none'), {
      target: { value: 'custom_text' },
    })
    fireEvent.change(screen.getByPlaceholderText('Watermark Text'), {
      target: { value: 'txt' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/customers', {
        body: {
          name: 'Cust',
          watermark_policy: 'custom_text',
          watermark_text: 'txt',
        },
      })
    })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Customer created'),
    )
  })

  it('shows watermark text field only for custom_text policy', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 10, total: 0 } },
    })

    render(
      <ToastProvider>
        <CustomersPage />
      </ToastProvider>,
    )

    expect(screen.queryByPlaceholderText('Watermark Text')).toBeNull()
    fireEvent.change(screen.getByDisplayValue('none'), {
      target: { value: 'custom_text' },
    })
    expect(screen.getByPlaceholderText('Watermark Text')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('custom_text'), {
      target: { value: 'default' },
    })
    expect(screen.queryByPlaceholderText('Watermark Text')).toBeNull()
  })

  it('updates customer', async () => {
    const page = {
      items: [
        { id: 1, name: 'Cust1', watermark_policy: 'none', watermark_text: null },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    }
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: page })

    render(
      <ToastProvider>
        <CustomersPage />
      </ToastProvider>,
    )

    await waitFor(() => expect(screen.getByDisplayValue('Cust1')).toBeInTheDocument())

    fireEvent.change(screen.getByDisplayValue('Cust1'), {
      target: { value: 'Cust1b' },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/customers/{id}',
        expect.objectContaining({
          params: { path: { id: 1 } },
          body: {
            name: 'Cust1b',
            watermark_policy: 'none',
            watermark_text: null,
          },
        }),
      )
    })
  })

  it('deletes customer', async () => {
    const page = {
      items: [
        { id: 1, name: 'Cust1', watermark_policy: 'none', watermark_text: null },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    }
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: page })

    render(
      <ToastProvider>
        <CustomersPage />
      </ToastProvider>,
    )

    await waitFor(() => expect(screen.getByDisplayValue('Cust1')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(apiClient.DELETE).toHaveBeenCalledWith(
        '/customers/{id}',
        expect.objectContaining({ params: { path: { id: 1 } } }),
      )
    })
  })
})
