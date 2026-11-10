// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('endereço da API', () => {
  it('usa caminhos relativos para o gateway local por padrão', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.resetModules();
    const { api } = await import('./api');
    expect(api.getUri({ url: '/api/v1/contents' })).toBe('/api/v1/contents');
    expect(api.getUri({ url: '/product.json' })).toBe('/product.json');
  });

  it('permite configurar a origem da API e do manifesto', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    vi.resetModules();
    const { api: configuredApi } = await import('./api');
    expect(configuredApi.getUri({ url: '/api/v1/contents' })).toBe(
      'https://api.example.com/api/v1/contents',
    );
    expect(configuredApi.getUri({ url: '/product.json' })).toBe(
      'https://api.example.com/product.json',
    );
  });
});
