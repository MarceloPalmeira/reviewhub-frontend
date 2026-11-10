// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewSocial } from './Social';
import { type Product, type User, api } from './api';

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  message: () => 'Erro na solicitação',
}));
const product: Product = {
  name: 'Teste',
  color: '#123456',
  domains: ['movies'],
  features: [],
};
const user: User = { id: 'u1', username: 'ana', display_name: 'Ana', bio: '' };
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('features sociais', () => {
  it('não apresenta nem consulta ações desativadas', () => {
    render(
      <MemoryRouter>
        <ReviewSocial reviewId="r1" user={user} product={product} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Comentários')).toBeNull();
    expect(screen.queryByRole('button', { name: /Curtir/ })).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });
  it('publica comentário e atualiza a lista quando habilitada', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({
        data: [{ id: 'c1', author_id: 'u1', text: 'Gostei' }],
      });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    render(
      <MemoryRouter>
        <ReviewSocial
          reviewId="r1"
          user={user}
          product={{ ...product, features: ['comments'] }}
        />
      </MemoryRouter>,
    );
    await screen.findByText('Nenhum comentário.');
    fireEvent.change(screen.getByLabelText('Comentário'), {
      target: { value: 'Gostei' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    await screen.findByText(/Gostei/);
    expect(api.post).toHaveBeenCalledWith('/api/v1/reviews/r1/comments', {
      text: 'Gostei',
    });
  });
  it('ativa curtida e exibe o novo estado', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { count: 0, liked: false } })
      .mockResolvedValue({ data: { count: 1, liked: true } });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    render(
      <MemoryRouter>
        <ReviewSocial
          reviewId="r1"
          user={user}
          product={{ ...product, features: ['review_likes'] }}
        />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Curtir (0)' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Descurtir (1)' }),
      ).toBeTruthy(),
    );
    expect(api.post).toHaveBeenCalledWith('/api/v1/reviews/r1/likes');
  });
});
