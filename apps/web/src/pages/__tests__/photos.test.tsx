import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotosPage from '../photos';
import { apiClient } from '../../../lib/api';

jest.mock('../../../lib/api', () => ({
  apiClient: { GET: jest.fn() },
}));

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
});
