// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImdbRating } from './ImdbRating';
import { api } from './api';

vi.mock('./api', () => ({ api: { get: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('nota do IMDb', () => {
  it('exibe nota, votos e link quando encontrada', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        configured: true,
        found: true,
        matched_by: 'imdb_id',
        imdb_id: 'tt0006864',
        rating: 7.7,
        votes: 16112,
        url: 'https://www.imdb.com/title/tt0006864/',
      },
    });
    render(<ImdbRating contentId="c1" />);
    const link = await screen.findByRole('link', { name: /IMDb/ });
    expect(link).toHaveProperty(
      'href',
      'https://www.imdb.com/title/tt0006864/',
    );
    expect(link.textContent).toContain('7.7');
    expect(link.textContent).toContain('16.112 votos');
    expect(api.get).toHaveBeenCalledWith('/api/v1/contents/c1/imdb');
  });

  it('não exibe nada sem chave configurada ou em erro', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { configured: false, found: false },
    });
    const { container, rerender } = render(<ImdbRating contentId="c1" />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(container.innerHTML).toBe('');
    vi.mocked(api.get).mockRejectedValueOnce(new Error('falha'));
    rerender(<ImdbRating contentId="c2" />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(container.innerHTML).toBe('');
  });
});
