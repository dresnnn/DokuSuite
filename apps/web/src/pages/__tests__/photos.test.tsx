import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PhotosPage from '../photos'
import PhotoDetailPage from '../photos/[id]'
import { apiClient } from '../../../lib/api'
import { undoStack } from '../../lib/undoStack'
import L from 'leaflet'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn(), PATCH: jest.fn() },
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { id: '1' } }),
}))

type MockMarker = {
  getElement: () => HTMLElement
  on: (event: string, cb: (e: unknown) => void) => void
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
    marker: (_: unknown, opts: { icon: string }): MockMarker => {
      const container = document.createElement('div')
      container.innerHTML = opts.icon
      const el = container.firstElementChild as HTMLElement
      const handlers: Record<string, (e: unknown) => void> = {}
      return {
        getElement: () => el,
        on: (event: string, cb: (e: unknown) => void) => {
          handlers[event] = cb
        },
        __handlers: handlers,
      }
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

describe('PhotosPage', () => {
  it('displays photos and paginates', async () => {
    const page1 = {
      items: [{ id: 1, mode: 'MOBILE', uploader_id: 'u1' }],
      meta: { page: 1, limit: 1, total: 2 },
    };
    const page2 = {
      items: [{ id: 2, mode: 'FIXED_SITE', uploader_id: 'u2' }],
      meta: { page: 2, limit: 1, total: 2 },
    };
    (apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 });

    render(<PhotosPage />);

    await waitFor(() => {
      expect(screen.getByText('Photo 1')).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Photo 2')).toBeInTheDocument();
    });
    expect(apiClient.GET).toHaveBeenLastCalledWith(
      '/photos',
      expect.objectContaining({
        params: { query: expect.objectContaining({ page: 2 }) },
      }),
    );

    fireEvent.click(screen.getByText('Grid'))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByTestId('photo')).toHaveTextContent('Photo 2')
  });

  it('submits filters', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: { items: [], meta: {} } })
    render(<PhotosPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())
    ;(apiClient.GET as jest.Mock).mockClear()

    fireEvent.change(screen.getByLabelText('From:'), {
      target: { value: '2024-01-01T00:00' },
    })
    fireEvent.change(screen.getByLabelText('To:'), {
      target: { value: '2024-12-31T23:59' },
    })
    fireEvent.change(screen.getByLabelText('Site ID:'), {
      target: { value: 'site1' },
    })
    fireEvent.change(screen.getAllByLabelText('Order ID:')[0], {
      target: { value: '42' },
    })
    fireEvent.change(screen.getByLabelText('Status:'), {
      target: { value: 'SHARED' },
    })

    fireEvent.click(screen.getByText('Fetch'))

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())
    expect(apiClient.GET).toHaveBeenCalledWith(
      '/photos',
      expect.objectContaining({
        params: {
          query: expect.objectContaining({
            from: '2024-01-01T00:00',
            to: '2024-12-31T23:59',
            siteId: 'site1',
            orderId: '42',
            status: 'SHARED',
          }),
        },
      }),
    )
  })

  it('assigns selected photos', async () => {
    const resp = {
      items: [
        { id: 1, mode: 'MOBILE', uploader_id: 'u1' },
        { id: 2, mode: 'MOBILE', uploader_id: 'u1' },
      ],
      meta: { page: 1, limit: 10, total: 2 },
    }
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: resp })
    render(<PhotosPage />)
    await waitFor(() => screen.getByText('Photo 1'))

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    fireEvent.change(screen.getAllByLabelText('Order ID:')[1], {
      target: { value: '999' },
    })
    fireEvent.change(screen.getByLabelText('Calendar Week:'), {
      target: { value: '2025-W01' },
    })
    fireEvent.click(screen.getByText('Assign'))

    expect(apiClient.POST).toHaveBeenCalledWith(
      '/photos/batch/assign',
      expect.objectContaining({
        body: {
          photoIds: ['1', '2'],
          orderId: '999',
          calendarWeek: '2025-W01',
        },
      }),
    )
  })

  it('uploads a photo', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: { items: [], meta: {} } })
    const uploadIntent = {
      url: 'http://upload',
      fields: { key: 'abc' },
    }
    ;(apiClient.POST as jest.Mock).mockResolvedValue({ data: uploadIntent })
    const originalFetch = global.fetch
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock

    render(<PhotosPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByTestId('photo-upload-input'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByTestId('photo-upload-button'))

    await waitFor(() =>
      expect(apiClient.POST).toHaveBeenCalledWith(
        '/photos/upload-intent',
        expect.objectContaining({
          body: { contentType: 'image/jpeg', size: file.size },
        }),
      ),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://upload',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    )
    const form = fetchMock.mock.calls[0][1].body as FormData
    expect(form.get('file')).toBe(file)
    expect(form.get('key')).toBe('abc')

    ;(global as unknown as { fetch: typeof fetch }).fetch = originalFetch
  })

  it('renders map markers', async () => {
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [], meta: {} } })
      .mockResolvedValueOnce({
        data: {
          items: [
            { id: 1, ad_hoc_spot: { lat: 1, lon: 1 } },
            { id: 2, ad_hoc_spot: { lat: 2, lon: 2 } },
          ],
          meta: {},
        },
      })
    render(<PhotosPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())
    fireEvent.click(screen.getByText('Map'))
    await waitFor(() =>
      expect(screen.getAllByTestId('marker')).toHaveLength(2),
    )
  })

  it('handles keyboard shortcuts and undo', async () => {
    undoStack.clear()
    const page1 = {
      items: [{ id: 1, mode: 'MOBILE', uploader_id: 'u1' }],
      meta: { page: 1, limit: 1, total: 2 },
    }
    const page2 = {
      items: [{ id: 2, mode: 'FIXED_SITE', uploader_id: 'u2' }],
      meta: { page: 2, limit: 1, total: 2 },
    }
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 })

    render(<PhotosPage />)

    await waitFor(() =>
      expect(screen.getByText('Photo 1')).toBeInTheDocument(),
    )

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        keyCode: 39,
        which: 39,
      }),
    )
    await waitFor(() =>
      expect(screen.getByText('Photo 2')).toBeInTheDocument(),
    )
    expect(apiClient.GET).toHaveBeenLastCalledWith(
      '/photos',
      expect.objectContaining({
        params: { query: expect.objectContaining({ page: 2 }) },
      }),
    )

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', keyCode: 65, which: 65 }),
    )
    await waitFor(() =>
      expect(screen.getAllByRole('checkbox')[0]).toBeChecked(),
    )
    const undoFn = jest.fn()
    undoStack.push(undoFn)
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        keyCode: 90,
        which: 90,
      }),
    )
    await waitFor(() => expect(undoFn).toHaveBeenCalled())
  })
})

describe('PhotoDetailPage', () => {
  it('updates photo metadata', async () => {
    jest.clearAllMocks()
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { quality_flag: 'ok', note: 'old' },
    })
    render(<PhotoDetailPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Quality Flag:'), {
      target: { value: 'bad' },
    })
    fireEvent.change(screen.getByLabelText('Note:'), {
      target: { value: 'new' },
    })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/photos/{id}',
        expect.objectContaining({
          params: { path: { id: 1 } },
          body: expect.objectContaining({
            quality_flag: 'bad',
            note: 'new',
          }),
        }),
      ),
    )
  })

  it('sends updated coordinates on marker drag', async () => {
    jest.clearAllMocks()
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [], meta: {} } })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 1, ad_hoc_spot: { lat: 1, lon: 1 } }],
          meta: {},
        },
      })
    render(<PhotosPage />)
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalled())
    fireEvent.click(screen.getByText('Map'))
    await waitFor(() =>
      expect(screen.getAllByTestId('marker')).toHaveLength(1),
    )
    const marker = (L as unknown as { __markers: MockMarker[] }).__markers[0]
    marker.__handlers.dragend({
      target: { getLatLng: () => ({ lat: 5, lng: 6 }) },
    })
    await waitFor(() =>
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/photos/{id}',
        expect.objectContaining({
          params: { path: { id: 1 } },
          body: { ad_hoc_spot: { lat: 5, lon: 6 } },
        }),
      ),
    )
  })
})
