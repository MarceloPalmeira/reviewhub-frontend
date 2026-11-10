import { expect, test } from '@playwright/test';

test('layouts desktop e mobile com dados reais', async ({ page }, testInfo) => {
  test.skip(
    (process.env.E2E_PRODUCT || 'complete') !== 'complete',
    'Verificação visual completa usa Complete',
  );
  const capture = async (name: string) => {
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Uma boa história/ }),
  ).toBeVisible();
  await expect(page.locator('.content-card').first()).toBeVisible();
  await capture('home-desktop');
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo/);
  await expect(
    page
      .locator('.catalog-section')
      .getByRole('link', { name: /A Última Estação/ }),
  ).toBeVisible();
  await capture('catalogo-desktop');
  await page.getByRole('link', { name: /A Última Estação/ }).click();
  await expect(page).toHaveURL(/\/conteudo\//);
  await expect(
    page
      .locator('.detail-hero')
      .getByRole('heading', { name: 'A Última Estação' }),
  ).toBeVisible();
  await capture('detalhes-desktop');
  await page.getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await capture('login-desktop');
  await page
    .getByRole('link', { name: 'Criar conta', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Criar conta' }),
  ).toBeVisible();
  await capture('cadastro-desktop');
  const name = `visual${Date.now()}`;
  await page.getByLabel('Usuário').fill(name);
  await page.getByLabel('Nome de exibição').fill('Pessoa de Exemplo');
  await page.getByLabel('E-mail').fill(`${name}@example.org`);
  await page.getByLabel('Senha', { exact: true }).fill('password123');
  await page.getByLabel('Confirmar senha').fill('password123');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page.getByRole('link', { name: 'Meu perfil' })).toBeVisible();
  await page.goto('/conteudo/demo-movies');
  await page
    .getByLabel('Review', { exact: true })
    .fill('Uma história que vale a pena conhecer.');
  await page.getByRole('button', { name: 'Salvar review' }).click();
  await expect(
    page.getByText('Uma história que vale a pena conhecer.'),
  ).toBeVisible();
  await capture('reviews-desktop');
  await page.getByRole('link', { name: 'Meu perfil' }).click();
  await expect(
    page.getByRole('heading', { name: 'Pessoa de Exemplo' }),
  ).toBeVisible();
  await capture('perfil-desktop');
  await page.getByRole('link', { name: 'Feed', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Histórias compartilhadas.' }),
  ).toBeVisible();
  await capture('feed-desktop');
  await page.getByRole('link', { name: 'Minhas listas' }).click();
  await expect(
    page.getByRole('heading', { name: 'Histórias para guardar.' }),
  ).toBeVisible();
  await capture('listas-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  const profileId = await page.evaluate(
    () => JSON.parse(localStorage.getItem('user') || '{}').id,
  );
  for (const [name, route, heading] of [
    ['home', '/', 'Uma boa história'],
    ['catalogo', '/catalogo', 'Seu próximo favorito'],
    ['detalhes', '/conteudo/demo-movies', 'A Última Estação'],
    ['perfil', `/perfil/${profileId}`, 'Pessoa de Exemplo'],
    ['feed', '/feed', 'Histórias compartilhadas.'],
    ['listas', '/listas', 'Histórias para guardar.'],
    ['login', '/entrar', 'Entrar'],
    ['cadastro', '/cadastro', 'Criar conta'],
  ]) {
    await page.goto(route);
    await expect(
      page
        .locator('main')
        .getByRole('heading', { name: new RegExp(heading) })
        .first(),
    ).toBeVisible();
    if (name === 'catalogo')
      await expect(
        page
          .locator('.catalog-section')
          .getByRole('link', { name: /A Última Estação/ }),
      ).toBeVisible();
    if (name === 'perfil') {
      await page.getByRole('tab', { name: 'Reviews' }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('tab', { name: 'Listas' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    }
    if (name === 'home') {
      await page.getByLabel('Menu do usuário').click();
      await expect(
        page.getByRole('link', { name: 'Meu perfil' }),
      ).toBeVisible();
      await page.getByRole('link', { name: 'Meu perfil' }).click();
      await expect(page).toHaveURL(/\/perfil\//);
      await expect(page.getByRole('link', { name: 'Meu perfil' })).toHaveCount(
        0,
      );
      await page.goto('/');
      await expect(
        page.getByRole('heading', { name: /Uma boa história/ }),
      ).toBeVisible();
      await expect(page.locator('.content-card').first()).toBeVisible();
    }
    await capture(`${name}-mobile`);
  }
});
