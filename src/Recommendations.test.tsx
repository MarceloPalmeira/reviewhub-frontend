// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Recommendations } from './Recommendations';
import { ServicesStatus } from './ServicesStatus';
import { api } from './api';

vi.mock('./api', () => ({ api: { get: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const user = { id: 'u1', username: 'ana', display_name: 'Ana', bio: '' };
const product = {
  name: 'CineHub',
  color: '#123456',
  domains: ['movies'],
  features: ['recommendations'],
};

describe('recomendações', () => {
  it('mostra itens e o motivo vindos do serviço', async () => {
    vi.mocked(api.get).mockImplementation(async (url) =>
      url === '/api/v1/recommendations'
        ? {
            data: {
              based_on: 3,
              items: [
                {
                  score: 1,
                  reason: 'Porque você curtiu Christopher Nolan',
                  content: {
                    id: 'c1',
                    domain: 'movies',
                    title: 'Interstellar',
                    description: '',
                    metadata: { year: 2014 },
                  },
                },
              ],
            },
          }
        : { data: {} },
    );
    render(
      <MemoryRouter>
        <Recommendations product={product} user={user} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Interstellar' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Porque você curtiu Christopher Nolan'),
    ).toBeTruthy();
    expect(screen.getByText('Com base nas suas 3 avaliações.')).toBeTruthy();
  });

  it('não chama o serviço sem login ou com a feature desligada', () => {
    const { container } = render(
      <MemoryRouter>
        <Recommendations product={product} user={null} />
        <Recommendations product={{ ...product, features: [] }} user={user} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe('');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('painel lista só os microsserviços do produto com o estado', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/health/reviews') throw new Error('fora');
      return { data: { status: 'ok' } };
    });
    render(<ServicesStatus product={{ ...product, features: [] }} />);
    await waitFor(() =>
      expect(screen.getAllByText('em execução')).toHaveLength(2),
    );
    expect(screen.getByText('indisponível')).toBeTruthy();
    expect(screen.queryByText('Recommendations')).toBeNull();
  });
});
