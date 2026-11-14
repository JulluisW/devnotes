// 📘 Day 12: instrumentation.ts = code that runs ONCE when the server starts
// (register), plus a hook for every server error (onRequestError).
// It lives next to app/ (here: src/instrumentation.ts). It's a special file name.
import type { Instrumentation } from 'next';

export async function register() {
  // NEXT_RUNTIME is 'nodejs' for our normal server ('edge' is another runtime
  // some hosts offer). Our env check uses Node APIs, so only run it there.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing env.ts runs the check. A missing or bad value throws HERE.
    // Measured with CMS_WEBHOOK_SECRET=short: every request got a 500, and the
    // log said exactly what's wrong ("CMS_WEBHOOK_SECRET: must be at least 16
    // characters"). Better than a site that looks fine until the first webhook fails.
    const { env } = await import('./lib/env');
    console.log(`[startup] environment OK (SITE_URL=${env.SITE_URL})`);
  }
}

// 📘 Called for every error the server catches: pages, Server Actions, Route
// Handlers and proxy. Even errors an error.tsx shows nicely land here, so you
// still hear about them. A real app sends this to an error tracker (Sentry and
// similar services). We print one JSON line, which log tools can search.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error);
  // The same "digest" the visitor sees on the error panel (Day 4), so a
  // "Reference: 1234" from a user can be matched to this log line.
  const digest = typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : undefined;

  console.error(
    JSON.stringify({
      level: 'error',
      message,
      digest,
      path: request.path,
      method: request.method,
      route: context.routePath,
      kind: context.routeType, // 'render' | 'route' | 'action' | 'proxy'
    }),
  );
};
