import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExportsPage from '../exports'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

describe('ExportsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('does not fetch exports on mount', () => {
    render(<ExportsPage />)

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

    render(<ExportsPage />)

    fireEvent.click(screen.getByText('Start ZIP Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/zip', {})
    })

    await waitFor(() => {
      expect(screen.getByText('e2')).toBeInTheDocument()
    })

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

    render(<ExportsPage />)

    fireEvent.click(screen.getByText('Start Excel Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/excel', {})
    })
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

    render(<ExportsPage />)

    fireEvent.click(screen.getByText('Start PDF Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/pdf', {})
    })

    await waitFor(() => {
      expect(screen.getByText('e4')).toBeInTheDocument()
    })

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
})
