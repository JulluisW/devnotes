import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
