// 📘 Day 2: An ASYNC Server Component. It fetches its own data, so the parent
// doesn't have to fetch the author and drill it down as a prop.
// "Fetch where you need it" is idiomatic in the App Router, because React.cache
// (and fetch memoization) make repeated calls cheap.
import Link from 'next/link';
import { getAuthor } from '@/data/authors';

export async function AuthorCard({ authorId }: { authorId: string }) {
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
