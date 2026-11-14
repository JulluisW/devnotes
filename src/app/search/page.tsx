// 📘 Day 10: SEARCH with searchParams. The search lives in the URL:
//   /search?q=routing&page=2
// So it can be shared, bookmarked, and the Back button works. No useState needed.
//
// searchParams is a Promise of the URL's query values. It's REQUEST data (it's
// different for every visitor), so with Cache Components, everything that awaits
// it must sit inside <Suspense>. Same rule as cookies on Day 9.
// Where you await decides how much is instant:
//   static shell (instant): the heading + both fallbacks
//   per request:            <SearchBox> and <Results>
// The build table shows ◐.
import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { Suspense } from 'react';
import { PostCard } from '@/components/post-card';
import { PostListSkeleton } from '@/components/skeletons';
import { searchPosts } from '@/data/posts';
import { parseSearchParams, searchHref } from './search-params';

export const metadata: Metadata = {
  title: 'Search',
  // 📘 SEO: every ?q= is a different URL with near-duplicate content. Ask Google
  // not to index them (but still follow the links to the posts).
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
};

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <Suspense fallback={<SearchBoxFallback />}>
        <SearchBox searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<PostListSkeleton count={2} />}>
        {/* 📘 Pass the PROMISE down. Awaiting it here, in the page, would make
            the whole page wait, and the heading would no longer be instant. */}
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchBox({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const { q } = parseSearchParams(await searchParams);

  return (
    // 📘 next/form with action="/search": submitting goes to /search?q=<input value>
    // as a client-side navigation (no full reload), and it still works without JS.
    // The form only sends its own inputs, so ?page= is dropped: a new search
    // always starts on page 1.
    <Form action="/search" className="mt-6 flex gap-2" role="search">
      {/* 📘 key={q}: defaultValue is only read when the input is created. When q
          changes (Back button, a link), the new key makes React create a fresh
          input with the new value. */}
      <input
        key={q}
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search posts, tags, authors…"
        aria-label="Search posts"
        className="w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
      />
      <button type="submit" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
        Search
      </button>
      {/* 📘 Day 10 homework #4 (Luis), reviewed: only shown when there's a search.
          A <Link> styled as a button, NOT a <Link> inside a <button>: interactive
          elements can't be nested (invalid HTML, and screen readers announce two
          controls in one). */}
      {q && (
        <Link
          href={searchHref('')}
          className="shrink-0 rounded-md border border-foreground/15 px-4 py-2 text-sm hover:bg-foreground/5"
        >
          Back to /search
        </Link>
      )}
    </Form>
  );
}

function SearchBoxFallback() {
  return <div className="mt-6 h-[38px] animate-pulse rounded-md bg-foreground/10" aria-hidden />;
}

async function Results({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const { q, page } = parseSearchParams(await searchParams);
  const result = await searchPosts(q, page); // cached per (q, page)

  return (
    <div className="mt-6">
      <p className="text-sm text-foreground/60">
        {q ? (
          <>
            {result.total} {result.total === 1 ? 'result' : 'results'} for “{q}”
          </>
        ) : (
          <>All {result.total} posts</>
        )}
      </p>

      {result.posts.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-foreground/15 p-6 text-center text-sm text-foreground/60">
          Nothing matches. Try “routing” or “typescript”.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {/* 📘 These links go to /posts/<slug>, but from this page they open in a
              MODAL (see app/search/@modal). Refresh while it's open: you get the full page. */}
          {result.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <Pagination q={q} page={result.page} pageCount={result.pageCount} />
    </div>
  );
}

// 📘 Pagination = plain links that change ?page=. Each page has its own URL, so
// it can be shared, and Back/Forward step through pages.
function Pagination({ q, page, pageCount }: { q: string; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  const linkClass = 'rounded-md border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5';
  const disabledClass = 'rounded-md border border-foreground/5 px-3 py-1.5 text-foreground/30';

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={searchHref(q, page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-foreground/60">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={searchHref(q, page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </nav>
  );
}
