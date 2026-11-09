// 📘 Day 1: app/page.tsx is the "/" route. It's a Server Component, so it can
// read data directly. No useEffect, no loading spinner, no API route needed.
//
// 📘 Day 2: The data is now ASYNC (a DB query with latency). The hero text
// doesn't need data, so it stays OUTSIDE <Suspense> and is sent instantly.
// Only <LatestPosts> waits for the DB and streams in when it's ready.
//
// 📘 Day 3: this one page now mixes THREE kinds of content (Partial Prerendering):
//   ① static        hero text                          → in the build output
//   ② cached        <LatestPosts> ('blog'), <Trending> ('minutes')
//                                                      → ALSO in the build output
//   ③ dynamic hole  <LiveStatsBadge> ('live', expire < 5 min) → fallback in the shell,
//                                                        value streamed per request
import { Suspense } from 'react';
import Link from 'next/link';
import { PostCard } from '@/components/post-card';
import { PostListSkeleton } from '@/components/skeletons';
import { getPublishedPosts, getTrendingPosts } from '@/data/posts';
import { getLiveStats } from '@/data/stats';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section>
        <Suspense fallback={<LiveStatsFallback />}>
          <LiveStatsBadge />
        </Suspense>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Learn Next.js by building it.</h1>
        <p className="mt-4 max-w-2xl text-foreground/70">
          DevNotes is a practice blog that grows one feature at a time: routing, data fetching, caching, SEO, Server
          Actions, auth and more.
        </p>
      </section>

      <div className="grid gap-10 md:grid-cols-[1fr_240px]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Latest posts</h2>
            <Link href="/posts" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <Suspense fallback={<PostListSkeleton />}>
            <LatestPosts />
          </Suspense>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">🔥 Trending</h2>
          <Suspense fallback={<PostListSkeleton count={3} />}>
            <Trending />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function LatestPosts() {
  const posts = await getPublishedPosts();

  return (
    <div className="grid gap-4">
      {posts.slice(0, 3).map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

async function Trending() {
  const posts = await getTrendingPosts();

  return (
    <ol className="space-y-3 text-sm">
      {posts.map((post, index) => (
        <li key={post.slug} className="flex gap-3">
          <span className="font-mono text-foreground/40">{index + 1}</span>
          <span>
            <Link href={`/posts/${post.slug}`} className="font-medium hover:underline">
              {post.title}
            </Link>
            <span className="block text-xs text-foreground/50">♥ {post.likes} likes</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

async function LiveStatsBadge() {
  const stats = await getLiveStats();

  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-700 dark:text-green-400">
      <span className="size-2 animate-pulse rounded-full bg-green-500" aria-hidden />
      {stats.readersNow} developers reading now · updated {stats.generatedAt.slice(11, 19)} UTC
    </p>
  );
}

function LiveStatsFallback() {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1 text-xs text-foreground/50">
      <span className="size-2 rounded-full bg-foreground/20" aria-hidden />
      Counting readers…
    </p>
  );
}
