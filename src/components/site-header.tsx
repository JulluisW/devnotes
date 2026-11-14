// 📘 Day 1: No "use client" here, so this is a Server Component (the default).
// It renders on the server and ships zero JS. It can still *render*
// Client Components like <NavLink>. Server → Client is the normal direction.
import Link from 'next/link';
import { NavLink } from './nav-link';

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Dev<span className="text-blue-600">Notes</span>
        </Link>
        <nav className="flex gap-5 text-sm">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/posts">Posts</NavLink>
          <NavLink href="/authors">Authors</NavLink>
          <NavLink href="/about">About</NavLink>
          {/* 📘 Day 10: search + pagination via searchParams, with a preview modal. */}
          <NavLink href="/search">Search</NavLink>
          {/* 📘 Day 9: a plain link, the same for everyone. The header is in the root
              layout, so reading the cookie here ("Hi Maya" / "Log in") would make
              EVERY page depend on the visitor, and none could be made at build time.
              proxy.ts sends logged-out visitors from /dashboard to /login. */}
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>
      </div>
    </header>
  );
}
