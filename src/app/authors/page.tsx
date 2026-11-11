import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthorCard } from '@/components/author-card';
import { LinkListSkeleton } from '@/components/skeletons';
import { getAuthors } from '@/data/authors';
import { baseOpenGraph } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Authors',
  description: 'The engineers who write DevNotes, and what each of them writes about.',
  alternates: { canonical: '/authors' },
  openGraph: { ...baseOpenGraph, type: 'website', url: '/authors' },
};

export default function AuthorsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
      <p className="mt-2 text-foreground/60">The people writing DevNotes.</p>
      <Suspense fallback={<LinkListSkeleton count={3} />}>
        <AuthorList />
      </Suspense>
    </div>
  );
}

async function AuthorList() {
  const authors = await getAuthors();

  // 📘 Each <AuthorCard> calls getAuthor(id) itself. That's 3 more queries,
  // but they run in PARALLEL (sibling async components render concurrently).
  // On Day 3 we'll cache these so they don't hit the DB at all.
  return (
    <div className="mt-8 grid gap-4">
      {authors.map((author) => (
        <AuthorCard key={author.id} authorId={author.id} />
      ))}
    </div>
  );
}
