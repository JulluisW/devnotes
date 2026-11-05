// 📘 Day 1: Special file. Rendered for unmatched URLs and whenever notFound()
// is called. Next.js responds with a 404 status. Day 4 goes deeper.
import Link from "next/link";

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
