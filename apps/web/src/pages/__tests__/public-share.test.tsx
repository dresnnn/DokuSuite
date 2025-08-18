import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import PublicSharePage from '../public/[token]'
import { apiClient } from '../../../lib/api'
import { useRouter } from 'next/router'
import L from 'leaflet'
import { ToastProvider } from '../../components/Toast'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

type MockMarker = {
  getElement: () => HTMLElement
  on: (event: string, cb: (e: unknown) => void) => void
  addTo: (_: unknown) => void
  __handlers: Record<string, (e: unknown) => void>
}

jest.mock('leaflet', () => {
  const markers: MockMarker[] = []
  const map = {
    setView: jest.fn().mockReturnThis(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getBounds: () => ({
      getSouth: () => 0,
      getWest: () => 0,
      getNorth: () => 1,
      getEast: () => 1,
    }),
    addLayer: jest.fn(),
  }
  return {
    map: () => map,
    tileLayer: () => ({ addTo: jest.fn() }),
    divIcon: ({ html }: { html: string }) => html,
    marker: (_: unknown, opts: { icon?: string }): MockMarker => {
      const container = document.createElement('div')
      container.innerHTML = opts.icon ?? '<div data-testid="marker"></div>'
      const el = container.firstElementChild as HTMLElement
      const handlers: Record<string, (e: unknown) => void> = {}
      const marker: MockMarker = {
        getElement: () => el,
        on: (event: string, cb: (e: unknown) => void) => {
          handlers[event] = cb
        },
        addTo: () => {
          markers.push(marker)
          document.body.appendChild(el)
        },
        __handlers: handlers,
      }
      return marker
    },
    markerClusterGroup: () => ({
      addLayer: (marker: MockMarker) => {
        markers.push(marker)
        document.body.appendChild(marker.getElement())
      },
      clearLayers: () => {
        markers.length = 0
        document
          .querySelectorAll('[data-testid="marker"]')
          .forEach((el) => el.remove())
      },
    }),
    __markers: markers,
  }
})

jest.mock('leaflet.markercluster', () => ({}), { virtual: true })

const mockedUseRouter = useRouter as jest.Mock

const renderPage = () =>
  render(
    <ToastProvider>
      <PublicSharePage />
    </ToastProvider>,
  )

describe('PublicSharePage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedUseRouter.mockReturnValue({
      query: { token: 'tok1' },
    })
    window.localStorage.clear()
    ;(L as unknown as { __markers: MockMarker[] }).__markers.length = 0
    document
      .querySelectorAll('[data-testid="marker"]')
      .forEach((el) => el.remove())
  })

  it('shows toast on 404 and renders error message', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ error: { status: 404 } })
      .mockResolvedValueOnce({ error: { status: 404 } })

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Freigabe nicht gefunden',
      )
    })
    expect(screen.getAllByText('Freigabe nicht gefunden')).toHaveLength(2)
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

    renderPage()

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

    renderPage()

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

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.change(screen.getByLabelText('Title:'), {
      target: { value: 'Public Zip' },
    })
    fireEvent.click(screen.getByLabelText('Include EXIF:'))
    fireEvent.click(screen.getByText('Download ZIP'))
    fireEvent.click(screen.getByText('Download Excel'))
    fireEvent.click(screen.getByText('Download PDF'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { photoIds: ['1'], title: 'Public Zip', includeExif: true },
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

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.change(screen.getByLabelText('Title:'), {
      target: { value: 'Public Zip' },
    })
    fireEvent.click(screen.getByLabelText('Include EXIF:'))
    fireEvent.click(screen.getByText('Download ZIP'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { photoIds: ['1'], title: 'Public Zip', includeExif: true },
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
    const { unmount } = renderPage()
    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getByText('Download ZIP'))
    await waitFor(() => expect(screen.getByText('s1')).toBeInTheDocument())
    unmount()
    renderPage()
    await waitFor(() => expect(screen.getByText('s1')).toBeInTheDocument())
    jest.useRealTimers()
  })

  it('renders markers on map view', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 1, ad_hoc_spot: { lat: 0, lon: 0 } }] },
      })

    renderPage()

    fireEvent.click(screen.getByText('Map'))

    await waitFor(() => {
      expect(screen.getByTestId('photo-map')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('marker').length).toBeGreaterThan(0)
    })
  })

  it('shows toast on map fetch error', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ error: {} })

    renderPage()

    fireEvent.click(screen.getByText('Map'))

    await waitFor(() => {
      expect(screen.getByTestId('photo-map')).toBeInTheDocument()
    })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load photos'),
    )
  })

  it('shows toast when export request fails', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }] },
      })
    ;(apiClient.POST as jest.Mock).mockRejectedValue(new Error('fail'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument())

    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getByText('Download ZIP'))

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('alert')
          .some((el) => el.textContent?.includes('Export fehlgeschlagen')),
      ).toBe(true),
    )
    expect(apiClient.POST).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Export Jobs')).not.toBeInTheDocument()
  })

  it('removes an export job', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({ data: { items: [] } })
    window.localStorage.setItem(
      'exportJobs:tok1',
      JSON.stringify([{ id: 'r1', status: 'done' }]),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText('r1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() =>
      expect(screen.queryByText('r1')).not.toBeInTheDocument(),
    )
    expect(window.localStorage.getItem('exportJobs:tok1')).toBe('[]')
  })

  it('shows toast and stops polling on export job error', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { download_allowed: true } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 1, thumbnail_url: 't1', original_url: 'o1' }] },
      })
      .mockResolvedValueOnce({ data: { id: 'e1', status: 'error' } })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e1', status: 'queued' },
    })

    renderPage()

    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getByText('Download ZIP'))
    await waitFor(() => expect(screen.getByText('e1')).toBeInTheDocument())

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(
        screen
          .getAllByRole('alert')
          .some((el) => el.textContent?.includes('Export fehlgeschlagen')),
      ).toBe(true),
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })
    const pollCalls = (apiClient.GET as jest.Mock).mock.calls.filter(
      (c) => c[0] === '/exports/{id}',
    )
    expect(pollCalls).toHaveLength(1)
    jest.useRealTimers()
  })
})

