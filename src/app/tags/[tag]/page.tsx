import { Suspense } from 'react';
import { getAllPosts, getPostsByTag } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  const tags = getAllPosts().reduce((acc, post) => {
    post.tags.forEach((tag) => {
      if (!acc.includes(tag)) {
        acc.push(tag);
      }
    });
    return acc;
  }, [] as string[]);

  return tags.map((tag) => ({ tag: tag }));
}

export default async function TagsPage({ params }: PageProps<'/tags/[tag]'>) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: Pick<PageProps<'/tags/[tag]'>, 'params'>) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
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

function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-4 w-48 rounded bg-foreground/10" />
      <div className="h-8 w-3/4 rounded bg-foreground/10" />
      <div className="h-24 rounded bg-foreground/10" />
    </div>
  );
}
