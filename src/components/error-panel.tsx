// 📘 Day 4: shared UI for our error.tsx files. Not a special file itself.
// It's a Client Component because error.tsx files are Client Components, and
// it needs an onClick for the retry button.
'use client';

import Link from 'next/link';

type ErrorPanelProps = {
  title: string;
  error: unknown;
  retry: () => void;
};

export function ErrorPanel({ title, error, retry }: ErrorPanelProps) {
  // 📘 `error` is `unknown`: a Client Component can throw anything, not only Errors.
  // Narrow it before reading properties.
  //
  // In PRODUCTION, errors thrown in Server Components arrive with a generic message
  // (so DB details, file paths and secrets never reach the browser) plus a `digest`:
  // a hash that also appears next to the real error in the server logs. Show it so a
  // user can report "reference abc123" and you can find the matching log line.
  const digest = error instanceof Error && 'digest' in error ? String(error.digest) : undefined;

  return (
    <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
      <p className="text-sm font-medium text-red-600">Something went wrong</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-foreground/60">
        This is usually temporary. Try again, or come back in a minute.
      </p>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background hover:bg-foreground/80"
        >
          Try again
        </button>
        <Link href="/" className="text-blue-600 hover:underline">
          Go home
        </Link>
      </div>
      {digest && <p className="mt-4 font-mono text-xs text-foreground/40">Reference: {digest}</p>}
    </div>
  );
}
