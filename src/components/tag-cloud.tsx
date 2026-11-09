// 📘 Day 3: 'use cache' on a COMPONENT. The whole rendered output (the JSX)
// is cached, not just the data. Use this when rendering itself is expensive
// or combines several data sources into one stable piece of UI.
// The cache key is the component + its props (none here, so one entry total).
import Link from 'next/link';
import { cacheLife, cacheTag } from 'next/cache';
import { getAllTags, getPublishedPosts } from '@/data/posts';

export async function TagCloud() {
  'use cache';
  cacheLife('blog');
  cacheTag('posts');

  const [tags, posts] = await Promise.all([getAllTags(), getPublishedPosts()]);
  const countFor = (tag: string) => posts.filter((post) => post.tags.includes(tag)).length;

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/tags/${tag}`}
            className="inline-block rounded-full border border-foreground/10 px-3 py-1 text-xs text-foreground/70 hover:border-foreground/30 hover:text-foreground"
          >
            #{tag} <span className="text-foreground/40">{countFor(tag)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
