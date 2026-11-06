import Link from 'next/link';
import type { PostSummary } from '@/data/posts';
import { formatDate } from '@/lib/format';

// 📘 Day 2: `import type` is erased at compile time. This component imports
// only the TYPE from the server-only DAL, so it's still safe to render anywhere.
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="rounded-lg border border-foreground/10 p-5 transition-colors hover:border-foreground/25">
      <p className="text-xs text-foreground/50">
        {formatDate(post.publishedAt)} ·{' '}
        <Link href={`/authors/${post.author.id}`} className="hover:text-foreground hover:underline">
          {post.author.name}
        </Link>
      </p>
      <h2 className="mt-1 text-lg font-semibold">
        {/* 📘 Typed routes understand template literals: `/posts/${string}`
            matches the /posts/[slug] route. */}
        <Link href={`/posts/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm text-foreground/70">{post.excerpt}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60">
            <Link href={`/tags/${tag}`} className="hover:underline">
              #{tag}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
