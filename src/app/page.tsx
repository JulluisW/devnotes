// 📘 Day 1: app/page.tsx is the "/" route. It's a Server Component, so it can
// read data directly. No useEffect, no loading spinner, no API route needed.
//
// 📘 Day 2: The data is now ASYNC (a DB query with latency). The hero text
// doesn't need data, so it stays OUTSIDE <Suspense> and is sent instantly.
// Only <LatestPosts> waits for the DB and streams in when it's ready.
import { Suspense } from 'react';
import Link from 'next/link';
import { PostCard } from '@/components/post-card';
import { PostListSkeleton } from '@/components/skeletons';
import { getPublishedPosts } from '@/data/posts';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-4xl font-bold tracking-tight">Learn Next.js by building it.</h1>
        <p className="mt-4 max-w-2xl text-foreground/70">
          DevNotes is a practice blog that grows one feature at a time: routing, data fetching, caching, SEO, Server
          Actions, auth and more.
        </p>
      </section>

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
