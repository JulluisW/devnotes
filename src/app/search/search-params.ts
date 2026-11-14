// 📘 Day 10: searchParams come from the URL, and anyone can type anything there:
//   /search?page=abc   /search?page=-3   /search?q=a&q=b   /search?q=%20%20
// So never use them raw. Turn them into clean, typed values first.
// (Not a special file: only page.tsx, layout.tsx, … are routes. This is a helper.)
import type { Route } from 'next';

type RawSearchParams = { [key: string]: string | string[] | undefined };

export function parseSearchParams(raw: RawSearchParams): { q: string; page: number } {
  // ?q=a&q=b gives an ARRAY. Keep the first value.
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const page = Number(Array.isArray(raw.page) ? raw.page[0] : raw.page);

  return {
    q: (q ?? '').trim().toLowerCase().slice(0, 50),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

// Builds /search?q=…&page=… and leaves out the defaults, so the first page of
// "all posts" is just /search. URLSearchParams handles the encoding (spaces, &, …).
export function searchHref(q: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/search?${query}` : '/search') as Route;
}
