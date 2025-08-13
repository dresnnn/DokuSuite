import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PhotosPage from '../photos'
import { apiClient } from '../../../lib/api'

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

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

    fireEvent.click(screen.getByText(/Toggle/));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByTestId('photo')).toHaveTextContent('Photo 2');
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
});
