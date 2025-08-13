import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('triggers export job', async () => {
    ;(apiClient.GET as jest.Mock).mockResolvedValue({ data: [] })
    ;(apiClient.POST as jest.Mock).mockResolvedValue({
      data: { id: 'e2', status: 'queued' },
    })

    render(<ExportsPage />)

    fireEvent.click(screen.getByText('Start Export'))

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/exports', {})
    })

    await waitFor(() => {
      expect(screen.getByText('e2')).toBeInTheDocument()
    })
  })
})
