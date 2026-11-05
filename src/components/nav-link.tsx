// 📘 Day 1: "use client" marks the boundary where server code ends and
// client code begins. This component needs usePathname(), a hook that only
// works in the browser, so it must be a Client Component.
// Everything it imports also becomes part of the client bundle, so keep
// client components small and push them to the leaves of your tree.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

type NavLinkProps = {
  // 📘 `Route` comes from typedRoutes: only URLs that actually exist
  // in src/app are accepted. Try href="/postz" and run `npx tsc --noEmit`.
  href: Route;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "font-medium text-foreground"
          : "text-foreground/60 transition-colors hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
