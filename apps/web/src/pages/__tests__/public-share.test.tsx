import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    window.localStorage.clear()
  })

  it('fetches and displays photos', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
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

    expect(apiClient.GET).toHaveBeenCalledWith('/public/shares/{token}', {
      params: { path: { token: 'tok1' } },
    })
    expect(apiClient.GET).toHaveBeenCalledWith('/public/shares/{token}/photos', {
      params: { path: { token: 'tok1' } },
    })
  })

  it('hides export buttons when downloads are forbidden', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: false } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }] },
      })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    expect(screen.queryByText('Download ZIP')).not.toBeInTheDocument()
    expect(screen.queryByText('Download Excel')).not.toBeInTheDocument()
    expect(screen.queryByText('Download PDF')).not.toBeInTheDocument()
  })

  it('posts exports for selected photos', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }],
        },
      })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e1', status: 'queued' },
    })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
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
    jest.useRealTimers()
  })

  it('polls export job until done and shows download link', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }],
        },
      })
      .mockResolvedValue({
        data: { id: 'e2', status: 'done', url: 'http://example.com/zip' },
      })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e2', status: 'queued' },
    })

    render(<PublicSharePage />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Download ZIP'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { photoIds: ['1'] },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('e2')).toBeInTheDocument()
    })

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/exports/{id}', {
        params: { path: { id: 'e2' } },
      })
      expect(screen.getByText('done')).toBeInTheDocument()
    })
    expect(screen.getByText('Download')).toHaveAttribute(
      'href',
      'http://example.com/zip',
    )
    jest.useRealTimers()
  })

  it('persists export jobs after reload', async () => {
    jest.useFakeTimers()
    const store: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => {
          store[k] = v
        },
        removeItem: (k: string) => {
          delete store[k]
        },
        clear: () => {
          for (const k of Object.keys(store)) delete store[k]
        },
      },
      configurable: true,
    })
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }] },
      })
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({ data: { items: [] } })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 's1', status: 'queued' },
    })
    const { unmount } = render(<PublicSharePage />)
    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Download ZIP'))
    await waitFor(() => expect(screen.getByText('s1')).toBeInTheDocument())
    unmount()
    render(<PublicSharePage />)
    await waitFor(() => expect(screen.getByText('s1')).toBeInTheDocument())
    jest.useRealTimers()
  })

  it('shows map view with share token', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({ data: { items: [] } })

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

