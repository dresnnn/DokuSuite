import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PublicSharePage from '../public/[token]'
import { apiClient } from '../../../lib/api'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

const mockedUseRouter = useRouter as jest.Mock

describe('PublicSharePage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
    })
  })

  it('fetches and displays photos', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [{ id: 1 }, { id: 2 }] } })
      .mockResolvedValueOnce({ data: { thumbnail_url: 't1', original_url: 'o1' } })
      .mockResolvedValueOnce({ data: { thumbnail_url: 't2', original_url: 'o2' } })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(2)
    })

    expect(apiClient.GET).toHaveBeenNthCalledWith(
      2,
      '/public/shares/{token}/photos/{id}',
      { params: { path: { token: 'tok1', id: 1 } } }
    )
    expect(apiClient.GET).toHaveBeenNthCalledWith(
      3,
      '/public/shares/{token}/photos/{id}',
      { params: { path: { token: 'tok1', id: 2 } } }
    )
  })

  it('posts exports for selected photos', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [{ id: 1 }] } })
      .mockResolvedValueOnce({ data: { thumbnail_url: 't1', original_url: 'o1' } })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Download ZIP'))
    fireEvent.click(screen.getByText('Download Excel'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { photoIds: ['1'] },
      })
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/excel', {
        body: { photoIds: ['1'] },
      })
    })
  })
})

