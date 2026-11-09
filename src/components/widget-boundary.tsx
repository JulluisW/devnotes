// 📘 Day 4: a COMPONENT-level error boundary, made with `catchError` from next/error.
//
// error.tsx files catch errors per route SEGMENT: when something inside fails,
// the whole page area below that segment's layout is replaced by the error UI.
// That's too much for a small widget. If the "readers now" badge fails, the
// home page should still show the hero, latest posts and trending list.
//
// <WidgetBoundary> limits the damage to the widget itself:
//
//   <WidgetBoundary name="Live stats">     ← catches errors from anything inside
//     <Suspense fallback={…}>             ← shows a fallback while it LOADS
//       <LiveStatsBadge />                ← may throw
//     </Suspense>
//   </WidgetBoundary>
//
// Suspense handles "not ready yet", the error boundary handles "failed". They
// usually wrap the same thing.
//
// Why catchError and not a hand-written React class boundary? It's Next.js-aware:
//   - notFound() and redirect() also work by throwing. catchError lets them pass through.
//   - retry() re-fetches the Server Component output from the server, not only re-renders.
//   - the error state clears automatically when you navigate to another page.
'use client';

import { catchError, type ErrorInfo } from 'next/error';

function WidgetFallback({ name }: { name: string }, { retry }: ErrorInfo) {
  return (
    <p
      role="alert"
      className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-400"
    >
      {name} unavailable right now.
      <button type="button" onClick={() => retry()} className="font-medium underline underline-offset-2">
        Retry
      </button>
    </p>
  );
}

// The returned component takes the fallback's props ({ name }) plus `children`.
export const WidgetBoundary = catchError(WidgetFallback);
