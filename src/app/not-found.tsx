// 📘 Day 1: Special file. Rendered for unmatched URLs and whenever notFound()
// is called. Next.js responds with a 404 status. Day 4 goes deeper.
//
// 📘 Day 4: this ROOT not-found.tsx has two jobs:
//   1. URLs that match NO route (/totally/unknown) → always a real 404, nothing renders first
//   2. notFound() calls with no closer not-found.tsx (e.g. /authors/nobody, /tags/nope)
// /posts/[slug] now has its own not-found.tsx, so missing posts get that one instead.
// The status code (404 vs 200) is NOT decided by this file. It depends on whether
// notFound() ran before or after the response started streaming.
import type { Metadata } from "next";
import Link from "next/link";

// 📘 Day 5: without this, a 404 page shows the home page's title in the tab.
// No `robots` needed: Next.js adds <meta name="robots" content="noindex"> to
// every 404 page by itself.
export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-foreground/60">
        That note doesn&apos;t exist (yet).
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back home
      </Link>
    </div>
  );
}
