import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PublicSharePage from '../public/[token]'
import { apiClient } from '../../../lib/api'
import { useRouter } from 'next/router'
import PhotoMap from '../../components/PhotoMap'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

jest.mock('../../components/PhotoMap', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="photo-map" />),
}))

const mockedUseRouter = useRouter as jest.Mock
const mockedPhotoMap = PhotoMap as jest.Mock

describe('PublicSharePage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
    })
  })

  it('fetches and displays photos', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [
          { id: 1, thumbnail_url: 't1', original_url: 'o1' },
          { id: 2, thumbnail_url: 't2', original_url: 'o2' },
        ],
      },
    })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(2)
    })

    expect(apiClient.GET).toHaveBeenCalledTimes(1)
    expect(apiClient.GET).toHaveBeenCalledWith('/public/shares/{token}/photos', {
      params: { path: { token: 'tok1' } },
    })
  })

  it('posts exports for selected photos', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }],
      },
    })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    expect(apiClient.GET).toHaveBeenCalledTimes(1)
    expect(apiClient.GET).toHaveBeenCalledWith('/public/shares/{token}/photos', {
      params: { path: { token: 'tok1' } },
    })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Download ZIP'))
    fireEvent.click(screen.getByText('Download Excel'))
    fireEvent.click(screen.getByText('Download PDF'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { photoIds: ['1'] },
      })
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/excel', {
        body: { photoIds: ['1'] },
      })
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/pdf', {
        body: { photoIds: ['1'] },
      })
    })
  })

  it('shows map view with share token', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    })

    render(<PublicSharePage />)

    fireEvent.click(screen.getByText('Map'))

    await waitFor(() => {
      expect(mockedPhotoMap).toHaveBeenCalledWith(
        expect.objectContaining({ shareToken: 'tok1' }),
        undefined,
      )
    })
  })
})

