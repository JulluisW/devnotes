import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { PostListSkeleton } from '@/components/skeletons';
import { getAllTags, getPostsByTag } from '@/data/posts';

// 📘 Day 2: the unique-tags logic moved into the DAL (getAllTags), so pages
// don't need to know how tags are stored.
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

export default function TagsPage({ params }: PageProps<'/tags/[tag]'>) {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: Pick<PageProps<'/tags/[tag]'>, 'params'>) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);
  if (posts.length === 0) notFound();
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Posts with #{tag}</h1>
      <p className="mt-2 text-foreground/60">{posts.length} articles so far.</p>
      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
