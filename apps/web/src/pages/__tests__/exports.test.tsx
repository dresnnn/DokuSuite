import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExportsPage from '../exports'
import { apiClient } from '../../../lib/api'
import { ToastProvider } from '../../components/Toast'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

describe('ExportsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    window.localStorage.clear()
  })

  it('does not fetch exports on mount', () => {
    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )

    expect(apiClient.GET).not.toHaveBeenCalled()
  })

  it('triggers ZIP export job and polls until done', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { id: 'e2', status: 'done', url: 'http://example.com' },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e2', status: 'queued' },
    })

    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByLabelText('Title:'), {
      target: { value: 'All Photos' },
    })
    fireEvent.click(screen.getByLabelText('Include EXIF:'))
    fireEvent.click(screen.getByText('Start ZIP Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { title: 'All Photos', includeExif: true },
      })
    })
    await waitFor(() => {
      expect(screen.getByText('e2')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Export started')

    expect(apiClient.GET).not.toHaveBeenCalled()

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
      'http://example.com',
    )
    jest.useRealTimers()
  })

  it('triggers Excel export job', async () => {
    jest.useFakeTimers()
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e3', status: 'queued' },
    })

    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByText('Start Excel Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/excel', {})
    })
    await waitFor(() => {
      expect(screen.getByText('e3')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Export started')
    expect(apiClient.GET).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('triggers PDF export job and polls until done', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { id: 'e4', status: 'done', url: 'http://example.com/pdf' },
    })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e4', status: 'queued' },
    })

    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByText('Start PDF Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/pdf', {})
    })
    await waitFor(() => {
      expect(screen.getByText('e4')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Export started')

    expect(apiClient.GET).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/exports/{id}', {
        params: { path: { id: 'e4' } },
      })
      expect(screen.getByText('done')).toBeInTheDocument()
    })
    expect(screen.getByText('Download')).toHaveAttribute(
      'href',
      'http://example.com/pdf',
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
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'p1', status: 'queued' },
    })
    const { unmount } = render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Start ZIP Export'))
    await waitFor(() => expect(screen.getByText('p1')).toBeInTheDocument())
    unmount()
    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )
    await waitFor(() => expect(screen.getByText('p1')).toBeInTheDocument())
    jest.useRealTimers()
  })
  it('shows error toast when export job fails during polling', async () => {
    jest.useFakeTimers()
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e5', status: 'queued' },
    })
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: { id: 'e5', status: 'error' },
    })

    render(
      <ToastProvider>
        <ExportsPage />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByText('Start ZIP Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {
        body: { title: undefined, includeExif: false },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('e5')).toBeInTheDocument()
    })

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/exports/{id}', {
        params: { path: { id: 'e5' } },
      })
    })

    await act(async () => {
      await Promise.resolve()
    })
    expect(
      screen.getAllByRole('alert').some((el) => el.textContent === 'Export failed'),
    ).toBe(true)
    jest.useRealTimers()
  })
})
