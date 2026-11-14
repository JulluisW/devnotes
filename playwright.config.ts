// 📘 Day 12: END-TO-END (E2E) TESTS with Playwright. A real browser clicks
// through the real app, like a visitor would. Slower than unit tests (seconds,
// not milliseconds), so use them for the flows that matter most.
//
// Run: npm run test:e2e   (builds the app first, then starts it on port 3200)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // one server with an in-memory DB: keep tests in order
  use: {
    baseURL: 'http://localhost:3200',
    // Use the Chrome already installed on this Mac (no extra browser download).
    // On a CI server, run `npx playwright install chromium` and remove this line.
    channel: 'chrome',
  },
  // Playwright starts the production server itself and waits for the health
  // check (Day 12's /api/health) before running any test.
  webServer: {
    command: 'npx next start -p 3200',
    url: 'http://localhost:3200/api/health',
    reuseExistingServer: false,
  },
});
