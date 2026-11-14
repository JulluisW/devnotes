// 📘 Day 12: the Day 10 modal, tested in a real browser.
import { expect, test } from '@playwright/test';

test('a search result opens a preview; refresh shows the full post', async ({ page }) => {
  await page.goto('/search?q=routing');
  await page.getByRole('link', { name: 'Layouts That Persist' }).click();

  // The URL changed, the preview is open, and the search box is still behind it.
  await expect(page).toHaveURL('/posts/layouts-that-persist');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Layouts That Persist' })).toBeVisible();
  await expect(page.getByRole('searchbox', { includeHidden: true })).toHaveCount(1);

  // Esc closes it and goes back to the results.
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/search?q=routing');
  await expect(dialog).toBeHidden();

  // A full page load never intercepts: the real post page, with its comment form.
  await page.goto('/posts/layouts-that-persist');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Layouts That Persist' })).toBeVisible();
});

test('pagination and a new search', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('link', { name: 'Next →' }).click();
  await expect(page).toHaveURL('/search?page=2');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();

  // A new search drops ?page= (it starts on page 1).
  await page.getByRole('searchbox').fill('Rafael');
  await page.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL('/search?q=Rafael');
  await expect(page.getByText('2 results for “rafael”')).toBeVisible();
});
