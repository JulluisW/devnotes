// 📘 Day 4 homework #2: the 404 for /authors/[id]. Rendered when AuthorProfile calls
// notFound(). It replaces the root app/not-found.tsx for this segment, and lists the
// real authors so a typo isn't a dead end.
// No 'use cache' needed here: getAuthors() is already cached in the DAL.
import Link from 'next/link';
import { getAuthors } from '@/data/authors';

export default async function AuthorNotFound() {
  const authors = await getAuthors();

  return (
    <div>
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">This author doesn&apos;t exist</h1>
      <p className="mt-3 text-foreground/60">
        Check the link for a typo, or pick one of our authors:
      </p>
      <ul className="mt-6 space-y-2">
        {authors.map((author) => (
          <li key={author.id}>
            <Link href={`/authors/${author.id}`} className="text-blue-600 hover:underline">
              {author.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
