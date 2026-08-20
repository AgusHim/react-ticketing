import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:3000/api/v1/events?**', async (route) => {
    await route.fulfill({
      json: {
        data: [
          {
            id: 'soft-neo-event',
            name: 'Soft Neo Festival',
            date: '2026-08-17T12:00:00.000Z',
            location: 'Solo',
            description: 'Visual smoke test',
            status: 'published',
            color: '#6c63d6',
            created_at: '2026-07-01T00:00:00.000Z',
            updated_at: '2026-07-01T00:00:00.000Z',
            community: {
              id: 'community-soft',
              slug: 'soft-community',
              name: 'Soft Community',
              type: 'general',
            },
          },
        ],
        meta: { total: 1, page: 1, limit: 12 },
      },
    });
  });
});

test('halaman publik memakai light Soft Neo-Brutalism', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Pilih Event Favoritmu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Soft Neo Festival' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Lihat Event/ })).toBeVisible();

  const homeTokens = await page.locator('body').evaluate((element) => {
    const styles = getComputedStyle(element);
    const rootStyles = getComputedStyle(document.documentElement);
    return {
      background: styles.backgroundColor,
      border: rootStyles.getPropertyValue('--border').trim(),
    };
  });
  expect(homeTokens.background).toBe('rgb(237, 240, 251)');
  expect(homeTokens.border).toBe('#1a1a1a');

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'YN Solo Event' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();

  await page.goto('/verify-ticket');
  await expect(page.getByRole('heading', { name: 'War Kursi' })).toBeVisible();
  await expect(page.getByText('Drag & drop PDF e-ticket')).toBeVisible();
});
