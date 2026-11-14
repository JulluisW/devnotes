// 📘 Day 12: log in, see the private dashboard, log out (Day 9 + Day 10).
import { expect, test } from '@playwright/test';

test('log in as Maya, see the dashboard, log out', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('maya@devnotes.internal');
  await page.getByLabel('Password').fill('devnotes-demo'); // the seed demo password
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Logged in as')).toContainText('Maya Chen');
  // The @stats slot rendered its numbers.
  await expect(page.getByRole('region', { name: 'Your numbers' })).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});
