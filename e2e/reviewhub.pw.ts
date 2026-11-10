import { type Page, expect, test } from '@playwright/test';

const product = process.env.E2E_PRODUCT || 'complete';
const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

async function register(page: Page, username: string) {
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Criar conta' })
    .click();
  await page.getByLabel('Usuário').fill(username);
  await page.getByLabel('Nome de exibição').fill(username);
  await page.getByLabel('E-mail').fill(`${username}@example.org`);
  await page.getByLabel('Senha', { exact: true }).fill('password123');
  await page.getByLabel('Confirmar senha').fill('password123');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page.getByRole('link', { name: 'Meu perfil' })).toBeVisible();
}

async function login(page: Page, username: string) {
  await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click();
  await page.getByLabel('Usuário').fill(username);
  await page.getByLabel('Senha').fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('link', { name: 'Meu perfil' })).toBeVisible();
}

async function openMovie(page: Page) {
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await page.getByRole('link', { name: /A Última Estação/ }).click();
  await expect(
    page.getByRole('heading', { name: 'A Última Estação' }),
  ).toBeVisible();
}

test('produto seleciona domínios e bloqueia recursos indisponíveis', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const expected =
    product === 'cinehub'
      ? 'CineHub'
      : product === 'matchhub'
        ? 'MatchHub'
        : 'ReviewHub Complete';
  await expect(
    page.getByRole('link', { name: expected, exact: true }),
  ).toBeVisible();
  await expect(page.locator('.content-card').first()).toBeVisible();
  const manifest = await (await page.request.get('/product.json')).json();
  await expect(page.locator('.app-shell')).toHaveCSS(
    '--accent',
    manifest.color,
  );
  await page.screenshot({
    path: testInfo.outputPath('produto-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const domains = await (await page.request.get('/api/v1/domains')).json();
  if (product === 'matchhub') {
    expect(domains).toEqual(['football_matches']);
    expect(
      (await page.request.get('/api/v1/contents?domain=movies')).status(),
    ).toBe(404);
    await register(page, `match${suffix}`);
    await expect(page.getByRole('link', { name: 'Minhas listas' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('link', { name: 'Feed' })).toHaveCount(0);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(
      (
        await page.request.get('/api/v1/lists', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await page.request.get('/api/v1/feed', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status(),
    ).toBe(404);
    await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
    await expect(page.getByRole('link', { name: /Azul FC/ })).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Explorar por domínio' })
        .getByRole('link', { name: 'Filmes' }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: /Azul FC/ }).click();
    await page
      .getByLabel('Review', { exact: true })
      .fill('Partida interessante');
    await page.getByRole('button', { name: 'Salvar review' }).click();
    await expect(page.getByText('Partida interessante')).toBeVisible();
    await expect(page.getByRole('button', { name: /Curtir/ })).toHaveCount(0);
    const entries = await (await page.request.get('/api/v1/reviews')).json();
    expect(
      (
        await page.request.get(`/api/v1/reviews/${entries[0].id}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status(),
    ).toBe(404);
  } else if (product === 'cinehub') {
    expect(domains).toEqual(['movies', 'series']);
    await expect(
      page
        .getByRole('navigation', { name: 'Explorar por domínio' })
        .getByRole('link', { name: 'Futebol' }),
    ).toHaveCount(0);
    expect(
      (
        await page.request.get('/api/v1/contents?domain=football_matches')
      ).status(),
    ).toBe(404);
    await register(page, `cine${suffix}`);
    await expect(
      page.getByRole('link', { name: 'Minhas listas' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Feed' })).toHaveCount(0);
  } else {
    expect(domains).toEqual([
      'movies',
      'series',
      'video_games',
      'football_matches',
      'music_albums',
    ]);
  }
});

test('fluxo de reviews, listas e interações sociais', async ({ page }) => {
  test.skip(
    product !== 'complete',
    'Fluxo social completo exige ReviewHub Complete',
  );
  const alice = `alice${suffix}`;
  const bruno = `bruno${suffix}`;
  await page.goto('/');
  await register(page, alice);
  await page.getByRole('button', { name: 'Sair' }).click();
  await login(page, alice);
  await openMovie(page);
  await page.getByLabel('Nota (0 a 5)').selectOption('4.5');
  await page.getByLabel('Título', { exact: true }).fill('Uma opinião');
  await page
    .getByLabel('Review', { exact: true })
    .fill('Primeira opinião do filme');
  await page.getByRole('button', { name: 'Salvar review' }).click();
  await expect(page.getByText('Primeira opinião do filme')).toBeVisible();
  await expect(
    page
      .locator('article')
      .filter({ hasText: 'Primeira opinião do filme' })
      .getByText('4.5'),
  ).toBeVisible();
  await page
    .getByLabel('Review', { exact: true })
    .fill('Opinião editada do filme');
  await page.getByRole('button', { name: 'Salvar review' }).click();
  await expect(page.getByText('Opinião editada do filme')).toBeVisible();
  await page.getByRole('link', { name: 'Meu perfil' }).click();
  await expect(page.getByText('Opinião editada do filme')).toBeVisible();
  await page.getByRole('link', { name: 'Minhas listas' }).click();
  await page.getByLabel('Nome da lista').fill('Favoritos E2E');
  await page.getByRole('button', { name: 'Criar lista' }).click();
  await expect(
    page.getByRole('heading', { name: 'Favoritos E2E' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Abrir lista' }).click();
  await expect(
    page.getByRole('heading', { name: 'Favoritos E2E', level: 1 }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar para minhas listas' }).click();
  await page.getByRole('link', { name: 'Meu perfil' }).click();
  await page.getByRole('tab', { name: 'Listas' }).click();
  await expect(page.getByRole('link', { name: /Favoritos E2E/ })).toBeVisible();
  await openMovie(page);
  await page.getByRole('button', { name: 'Adicionar à lista' }).click();
  await expect(page.getByText('Conteúdo adicionado à lista.')).toBeVisible();
  await page.getByRole('link', { name: 'Minhas listas' }).click();
  await expect(
    page.getByRole('link', { name: 'A Última Estação' }),
  ).toBeVisible();
  await page.getByLabel('Editar nome').fill('Lista editada');
  await page.getByRole('button', { name: 'Salvar lista' }).click();
  await expect(
    page.getByRole('heading', { name: 'Lista editada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Remover da lista' }).click();
  await expect(page.getByText('Esta lista ainda está vazia.')).toBeVisible();
  await page.getByRole('button', { name: 'Excluir lista' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar exclusão' })
    .click();
  await expect(page.getByText('Você ainda não criou listas.')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await register(page, bruno);
  await openMovie(page);
  const review = page
    .locator('article')
    .filter({ hasText: 'Opinião editada do filme' });
  await review.getByRole('button', { name: 'Curtir (0)' }).click();
  await expect(
    review.getByRole('button', { name: 'Descurtir (1)' }),
  ).toBeVisible();
  await review.getByLabel('Comentário').fill('Comentário real E2E');
  await review.getByRole('button', { name: 'Comentar' }).click();
  await expect(review.getByText('Comentário real E2E')).toBeVisible();
  await review.getByRole('link', { name: 'Ver autor' }).click();
  await page.getByRole('button', { name: 'Seguir', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Deixar de seguir' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Feed', exact: true }).click();
  await expect(page.getByText('Opinião editada do filme')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
  await login(page, alice);
  await openMovie(page);
  await page.getByRole('button', { name: 'Excluir review' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar exclusão' })
    .click();
  await expect(page.getByText('Opinião editada do filme')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair' }).click();
});
