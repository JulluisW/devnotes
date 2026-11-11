import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PostCard } from '@/components/post-card';
import { LinkListSkeleton, PostListSkeleton } from '@/components/skeletons';
import { TagCloud } from '@/components/tag-cloud';
import { getPublishedPosts } from '@/data/posts';
import { baseOpenGraph } from '@/lib/site';

// 📘 Day 5: the canonical says "the official address of this page is /posts".
// So Google treats /posts?utm_source=newsletter as the same page, not a copy.
export const metadata: Metadata = {
  title: 'All posts',
  description: 'Every DevNotes article, newest first: routing, data fetching, caching, SEO and more.',
  alternates: { canonical: '/posts' },
  openGraph: { ...baseOpenGraph, type: 'website', url: '/posts' },
};

export default function PostsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">All posts</h1>
      <div className="mt-4">
        <Suspense fallback={<LinkListSkeleton count={1} />}>
          <TagCloud />
        </Suspense>
      </div>
      <Suspense fallback={<PostListSkeleton count={4} />}>
        <PostList />
      </Suspense>
    </div>
  );
}

async function PostList() {
  const posts = await getPublishedPosts();

  return (
    <>
      <p className="mt-2 text-foreground/60">{posts.length} articles so far.</p>
      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
