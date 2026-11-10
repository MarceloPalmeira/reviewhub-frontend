// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ExternalSearch } from './ExternalSearch';
import { type Product, api } from './api';

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  message: () => 'Serviço indisponível',
}));
const product: Product = {
  name: 'CineHub',
  color: '#123456',
  domains: ['movies'],
  features: ['external_tmdb'],
};
const user = { id: 'user', username: 'ana', display_name: 'Ana', bio: '' };
const item = {
  provider: 'tmdb',
  external_id: '123',
  domain: 'movies',
  title: 'Filme real',
  description: 'Sinopse real',
  metadata: {},
  genres: ['Drama'],
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('busca, mostra detalhes e importa para um ID interno', async () => {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: { configured: true, results: [item] } })
    .mockResolvedValueOnce({ data: item });
  vi.mocked(api.post).mockResolvedValue({ data: { id: 'local-123' } });
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ExternalSearch
              product={product}
              user={user}
              domain="movies"
              query="filme"
            />
          }
        />
        <Route path="/conteudo/:id" element={<p>Conteúdo importado</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Buscar mais conteúdos' }),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes' }));
  expect(await screen.findByText('Sinopse real')).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Adicionar ao catálogo' }),
  );
  expect(await screen.findByText('Conteúdo importado')).toBeTruthy();
  expect(api.post).toHaveBeenCalledWith('/api/v1/external/import', {
    domain: 'movies',
    external_id: '123',
  });
});

it('não pesquisa se a feature estiver desativada e informa indisponibilidade', async () => {
  const { rerender } = render(
    <MemoryRouter>
      <ExternalSearch
        product={{ ...product, features: [] }}
        user={user}
        domain="movies"
        query="filme"
      />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole('button', { name: 'Buscar mais conteúdos' }),
  ).toBeNull();
  expect(api.get).not.toHaveBeenCalled();
  vi.mocked(api.get).mockResolvedValue({
    data: { configured: false, results: [] },
  });
  rerender(
    <MemoryRouter>
      <ExternalSearch
        product={product}
        user={user}
        domain="movies"
        query="filme"
      />
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Buscar mais conteúdos' }),
  );
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Busca adicional indisponível',
  );
});
