import Link from 'next/link';
import { getPostBySlug, getPublishedPosts } from '@/data/posts';

// 📘 Day 2: This calls getPostBySlug(slug) AGAIN, even though <PostContent>
// already fetched the same post. Because getPostBySlug is wrapped in
// React.cache, the second call reuses the first result: no extra DB query.
export async function RelatedPosts({ slug }: { slug: string }) {
  const [post, allPosts] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);
  if (!post) return null;

  const related = allPosts
    .filter((other) => other.slug !== slug && other.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/50">Related posts</h2>
      <ul className="mt-3 space-y-2">
        {related.map((other) => (
          <li key={other.slug}>
            <Link href={`/posts/${other.slug}`} className="text-blue-600 hover:underline">
              {other.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
