// 📘 Day 9: PROXY (called "middleware" before Next.js 16).
// This function runs BEFORE a request reaches a page, for every URL the
// `matcher` below allows. It can let the request through, redirect it,
// rewrite it, or change headers.
//
// Timeline of a logged-out visit to /dashboard:
//   1. browser: GET /dashboard (no devnotes_session cookie)
//   2. proxy: no cookie → answers 307 → /login   (the page code never runs)
//   3. browser: GET /login
//
// 📘 It's only an OPTIMISTIC check: "is there a cookie with this name?"
// It does NOT look the session up in the database, because:
//   - proxy runs on many requests (including prefetches), so it must be fast
//   - the docs say proxy shouldn't rely on shared modules or globals (our
//     in-memory DB is a global), because it can run separately from the app
// A fake or expired cookie gets past the proxy. The page's DAL (requireUser)
// catches it. Proxy = a fast first filter, NOT the security check.
import { NextResponse, type NextRequest } from 'next/server';

// Same name as SESSION_COOKIE in src/lib/session.ts. (Not imported: that file
// talks to the database, and proxy shouldn't.)
const SESSION_COOKIE = 'devnotes_session';

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next(); // let the request continue to the page
}

// 📘 Only run for the dashboard. Without a matcher, proxy runs on EVERY
// request, including CSS, JS and images.
export const config = {
  matcher: ['/dashboard/:path*'],
};
