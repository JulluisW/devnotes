import 'server-only';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db';

export type LiveStats = { readersNow: number; generatedAt: string };

// 📘 Day 3: our custom 'live' profile (revalidate 10s, expire 2 min) is TOO SHORT
// to bake into a build: anything with expire under 5 min is excluded from the
// prerender. Next.js leaves this as a "dynamic hole": the page's
// static shell ships instantly with a fallback, and this value streams in at
// request time. Requests within the same 10 seconds still share one result,
// so a traffic spike doesn't hammer the DB.
//
// Math.random() and new Date() are allowed here because 'use cache' captures
// the result. Outside a cache, Next.js would make you call `await connection()`
// first to say "this is intentionally per-request".
export async function getLiveStats(): Promise<LiveStats> {
  'use cache';
  cacheLife('live');
  const posts = await db.posts.findMany({ status: 'published' });
  return {
    readersNow: posts.length * 3 + Math.floor(Math.random() * 20),
    generatedAt: new Date().toISOString(),
  };
}
