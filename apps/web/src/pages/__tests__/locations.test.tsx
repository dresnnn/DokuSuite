import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LocationsPage from '../locations'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), PATCH: jest.fn() },
}))

describe('LocationsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists locations, searches and paginates', async () => {
    const page1 = {
      items: [{ id: 1, name: 'Loc1', address: 'A', active: true }],
      meta: { page: 1, limit: 1, total: 2 },
    }
    const page2 = {
      items: [{ id: 2, name: 'Loc2', address: 'B', active: false }],
      meta: { page: 2, limit: 1, total: 2 },
    }
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 })
      .mockResolvedValue({ data: page1 })

    render(<LocationsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Loc1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Loc2')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('q'), {
      target: { value: 'foo' },
    })
    fireEvent.change(screen.getByPlaceholderText('near'), {
      target: { value: '1,2' },
    })
    fireEvent.change(screen.getByPlaceholderText('radius_m'), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenLastCalledWith(
        '/locations',
        expect.objectContaining({
          params: {
            query: expect.objectContaining({
              q: 'foo',
              near: '1,2',
              radius_m: 100,
            }),
          },
        }),
      )
    })
  })

  it('updates location', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: {
        items: [{ id: 1, name: 'Old', address: 'A', active: true }],
        meta: { page: 1, limit: 10, total: 1 },
      },
    })
    ;(apiClient.PATCH as jest.Mock).mockResolvedValue({ data: {} })

    render(<LocationsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Old')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByDisplayValue('Old'), {
      target: { value: 'New' },
    })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(apiClient.PATCH).toHaveBeenCalledWith('/locations/{id}', {
        params: { path: { id: 1 } },
        body: { name: 'New', address: 'A', active: true },
      })
    })
  })
})

