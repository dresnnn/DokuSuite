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

  it('lists exports and shows download link', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({
      data: [{ id: 'e1', status: 'done', url: 'http://example.com' }],
    })

    render(<ExportsPage />)

    await waitFor(() => {
      expect(screen.getByText('e1')).toBeInTheDocument()
    })

    expect(screen.getByText('done')).toBeInTheDocument()
    expect(screen.getByText('Download')).toHaveAttribute(
      'href',
      'http://example.com',
    )
  })

  it('triggers ZIP export job and polls until done', async () => {
    jest.useFakeTimers()
    ;(apiClient.GET as jest.Mock)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
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

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.getByText('done')).toBeInTheDocument()
    })
    expect(screen.getByText('Download')).toHaveAttribute(
      'href',
      'http://example.com',
    )
    jest.useRealTimers()
  })

  it('triggers Excel export job', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: [] })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e3', status: 'queued' },
    })

    render(<ExportsPage />)

    fireEvent.click(screen.getByText('Start Excel Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports/excel', {})
    })
  })
})
