import type { NextConfig } from 'next';

// 📘 Day 12: SECURITY HEADERS, added to every response. Each one turns off a
// browser feature that attackers can misuse and DevNotes doesn't need.
const securityHeaders = [
  // Don't let the browser guess file types (a "picture" can't run as a script).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't let other sites show DevNotes inside an <iframe> (fake-button tricks).
  { key: 'X-Frame-Options', value: 'DENY' },
  // When a visitor clicks a link to another site, only send our domain, not the full URL.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // DevNotes never uses the camera, microphone or location. Say so.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // 📘 Day 12: don't advertise "X-Powered-By: Next.js" (no need to tell attackers).
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // 📘 Day 1: typed <Link href> and router.push(). Typos in URLs become compile errors.
  typedRoutes: true,
  cacheComponents: true,
  partialPrefetching: true,
  // 📘 Day 3: CUSTOM cache profiles. Use them with cacheLife('blog') / cacheLife('live')
  // inside any 'use cache' scope. Values are in seconds.
  cacheLife: {
    // expire < 5 min → excluded from the prerender, so it's a dynamic hole (/ stays ◐).
    // Homework #4 experiment: with expire: 300 the hole disappears and / becomes ○ (10s / 5m).
    live: {
      stale: 30,
      revalidate: 10,
      expire: 120,
    },
    blog: {
      stale: 60 * 5, // browser reuses it for 5 min without asking the server
      revalidate: 60 * 60, // after 1 h, the next request triggers a background refresh
      expire: 60 * 60 * 24 * 7, // after 1 week with no traffic, the next request waits for fresh data
    },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
