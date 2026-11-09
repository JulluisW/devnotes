import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { getAllTags, getPostsByTag } from '@/data/posts';

// 📘 Day 2: the unique-tags logic moved into the DAL (getAllTags), so pages
// don't need to know how tags are stored.
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

// 📘 Day 4 homework #1: like the post page, this page must be fully static. For a tag
// that wasn't prerendered, Next.js waits for the complete page instead of sending
// loading.tsx first, so /tags/nope gets a real 404 on the first visit.
export const ensureStatic = 'navigation';

// 📘 Day 4: the page is async and awaits params at the TOP. That's fine now,
// because ./loading.tsx wraps this whole page in <Suspense>. The await happens
// inside that boundary, so Next.js can still build an App Shell (layout + loading UI)
// for tags it hasn't seen yet. Before Day 4 we needed an inner <PostContent>
// component inside a hand-written <Suspense> to get the same result.
export default async function TagPage({ params }: PageProps<'/tags/[tag]'>) {
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
