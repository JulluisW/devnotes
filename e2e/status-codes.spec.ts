// 📘 Day 12: status codes from Day 4 and Day 9. `request` sends plain HTTP
// requests (no browser), so we can check the exact code before any redirect.
import { expect, test } from '@playwright/test';

test('a missing post is a real 404', async ({ request }) => {
  const response = await request.get('/posts/does-not-exist');
  expect(response.status()).toBe(404);
});

test('an old post URL is a permanent redirect (308)', async ({ request }) => {
  const response = await request.get('/posts/server-components-101', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  // 📘 Found by this test: Next.js 16.4.5 sends the Location header TWICE (same
  // value both times), so Playwright joins them as "a, a". Browsers and Google
  // follow it fine. Checked on the Day 10 build too: it's Next.js, not our code.
  expect(response.headers()['location']).toContain('/posts/why-server-components');
});

test('logged-out visitors are sent from /dashboard to /login (proxy.ts)', async ({ request }) => {
  const response = await request.get('/dashboard', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()['location']).toContain('/login');
});

test('security headers are on every page', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['x-powered-by']).toBeUndefined();
});
