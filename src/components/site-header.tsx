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
        </nav>
      </div>
    </header>
  );
}
