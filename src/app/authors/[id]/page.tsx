import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { PostListSkeleton } from '@/components/skeletons';
import { getAuthor, getAuthors } from '@/data/authors';
import { getPostsByAuthor } from '@/data/posts';
import { formatDate } from '@/lib/format';

export async function generateStaticParams() {
  const authors = await getAuthors();
  return authors.map((author) => ({ id: author.id }));
}

// 📘 Day 4 homework #1: fully static, so /authors/nobody is a real 404 on the first visit.
export const ensureStatic = 'navigation';

export default function AuthorPage({ params }: PageProps<'/authors/[id]'>) {
  return (
    <Suspense fallback={<PostListSkeleton count={2} />}>
      <AuthorProfile params={params} />
    </Suspense>
  );
}

async function AuthorProfile({ params }: Pick<PageProps<'/authors/[id]'>, 'params'>) {
  const { id } = await params;

  // 📘 Day 2: PARALLEL fetching. Both queries only need `id`, which we
  // already have, so neither has to wait for the other.
  //
  //   ❌ Waterfall (≈ 500ms + 600ms = 1.1s):
  // const author = await getAuthor(id);
  // const posts = await getPostsByAuthor(id);
  //
  //   ✅ Parallel (≈ max(500ms, 600ms) = 0.6s):
  const [author, posts] = await Promise.all([getAuthor(id), getPostsByAuthor(id)]);

  if (!author) notFound();

  return (
    <div>
      <p className="text-sm text-foreground/50">
        {author.role} · joined {formatDate(author.joinedAt)}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{author.name}</h1>
      <p className="mt-3 max-w-2xl text-foreground/70">{author.bio}</p>

      <h2 className="mt-10 text-xl font-semibold">
        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
      </h2>
      <div className="mt-4 grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
