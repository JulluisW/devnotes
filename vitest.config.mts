// 📘 Day 12: UNIT TESTS with Vitest. `npm test` runs every src/**/*.test.ts file.
// Unit tests check plain functions (input → output) in milliseconds, without a
// browser or a server. For pages and async Server Components, use the
// Playwright tests in e2e/ instead (the Next.js docs say the same).
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // understands the @/… imports
    alias: {
      // 'server-only' throws outside Next.js on purpose. In tests we're on the
      // server anyway, so swap it for an empty file.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
