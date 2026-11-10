// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { App } from './main';

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  message: () => 'Erro na solicitação',
}));
const product = {
  name: 'CineHub',
  color: '#123456',
  domains: ['movies', 'series'],
  features: ['comments'],
};
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('aplicação', () => {
  it('efetua login e apresenta a navegação autenticada', async () => {
    vi.mocked(api.get).mockImplementation(async (url) =>
      url === '/product.json' ? { data: product } : { data: [] },
    );
    vi.mocked(api.post).mockResolvedValue({
      data: {
        access_token: 'token',
        user: { id: 'u1', username: 'ana', display_name: 'Ana', bio: '' },
      },
    });
    render(
      <MemoryRouter initialEntries={['/entrar']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.change(await screen.findByLabelText('Usuário'), {
      target: { value: 'ana' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('link', { name: 'Meu perfil' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', {
      username: 'ana',
      password: 'password123',
    });
    expect(localStorage.getItem('token')).toBe('token');
    expect(screen.queryByRole('link', { name: 'Feed' })).toBeNull();
  });
  it('redireciona ao login quando o feed exige autenticação', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ...product, features: ['social_feed', 'user_follows'] },
    });
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy();
  });
  it('mostra apenas conteúdos com média real acima do limite entre as novidades', async () => {
    const contents = [
      {
        id: 'a',
        title: 'Bem avaliado',
        domain: 'movies',
        description: '',
        metadata: {},
      },
      {
        id: 'b',
        title: 'Sem avaliação',
        domain: 'movies',
        description: '',
        metadata: {},
      },
    ];
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/product.json') return { data: product };
      if (url === '/api/v1/contents') return { data: contents };
      if (url === '/api/v1/reviews/stats/batch')
        return {
          data: {
            a: { count: 2, average: 4.5 },
            b: { count: 0, average: null },
          },
        };
      return { data: [] };
    });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const heading = await screen.findByRole('heading', {
      name: 'Bem avaliados',
    });
    const section = heading.closest('section');
    expect(section).toBeTruthy();
    if (!section) throw new Error('Seção não encontrada');
    expect(
      within(section).getByRole('heading', { name: 'Bem avaliado' }),
    ).toBeTruthy();
    expect(
      within(section).queryByRole('heading', { name: 'Sem avaliação' }),
    ).toBeNull();
    expect(
      vi
        .mocked(api.get)
        .mock.calls.filter(([url]) => url === '/api/v1/reviews/stats/batch'),
    ).toHaveLength(1);
    expect(
      vi
        .mocked(api.get)
        .mock.calls.filter(([url]) => url === '/api/v1/reviews/stats'),
    ).toHaveLength(0);
  });
});
