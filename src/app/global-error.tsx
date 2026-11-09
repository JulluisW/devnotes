// 📘 Day 4: global-error.tsx is the LAST line of defense. It only renders when the
// ROOT LAYOUT itself (or something it renders, like <SiteHeader>) throws.
//
// When that happens there's no layout left to render inside, so this file
// REPLACES the root layout and must render its own <html> and <body>. It also
// doesn't get the root layout's fonts or metadata, so we import globals.css
// ourselves and set the title with React's <title> (metadata exports aren't
// allowed in Client Components).
//
// Keep it boring: no data fetching, no shared components that might be the
// thing that crashed.
'use client';

import './globals.css';

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <title>Something went wrong · DevNotes</title>
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-red-600">500</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">DevNotes is having trouble</h1>
          <p className="mt-3 text-foreground/60">
            The whole site failed to load. This is on us, not you.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
