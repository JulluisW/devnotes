// 📘 Day 2: An ASYNC Server Component. It fetches its own data, so the parent
// doesn't have to fetch the author and drill it down as a prop.
// "Fetch where you need it" is idiomatic in the App Router, because React.cache
// (and fetch memoization) make repeated calls cheap.
//
// 📘 Day 3 (homework #3): a COMPONENT-level cache. 'use cache' at the top of a
// component caches its rendered OUTPUT (the finished card), not just the data.
// The props ({ authorId }) are the cache key: one entry per author.
// Tags = "what data is this built from?" → only the author, so editing Maya on
// Day 7 (updateTag('author:maya')) refreshes Maya's card and nobody else's.
// No 'posts' tag: editing a post doesn't change what this card shows.
import Link from 'next/link';
import { cacheLife, cacheTag } from 'next/cache';
import { getAuthor } from '@/data/authors';

export async function AuthorCard({ authorId }: { authorId: string }) {
  'use cache';
  cacheLife('days');
  cacheTag('authors', `author:${authorId}`);

  const author = await getAuthor(authorId);
  if (!author) return null;

  return (
    <Link
      href={`/authors/${author.id}`}
      className="flex items-center gap-4 rounded-lg border border-foreground/10 p-4 transition-colors hover:border-foreground/25"
    >
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600/15 font-semibold text-blue-600"
      >
        {author.name
          .split(' ')
          .map((part) => part[0])
          .join('')}
      </span>
      <span>
        <span className="block font-medium">
          {author.name} <span className="text-sm font-normal text-foreground/50">· {author.role}</span>
        </span>
        <span className="block text-sm text-foreground/60">{author.bio}</span>
      </span>
    </Link>
  );
}
