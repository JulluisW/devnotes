import { Suspense } from 'react';
import { AuthorCard } from '@/components/author-card';
import { LinkListSkeleton } from '@/components/skeletons';
import { getAuthors } from '@/data/authors';

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
