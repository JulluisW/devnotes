// 📘 Day 4: error.tsx = an error boundary for this route SEGMENT and everything below it.
//
// Where it sits (one segment):
//   <Layout>                    ← NOT covered by this segment's error.tsx
//     <ErrorBoundary>           ← error.tsx
//       <Suspense>              ← loading.tsx
//         <NotFoundBoundary>    ← not-found.tsx
//           <Page />
//
// This is the ROOT segment's error.tsx, so it catches errors in every page, but
// it renders INSIDE the root layout: the header and footer stay visible. Errors
// in the root layout itself go to global-error.tsx.
//
// It must be a Client Component: error boundaries catch errors in the browser,
// and the retry button needs onClick.
'use client';

import { useEffect } from 'react';
import { ErrorPanel } from '@/components/error-panel';

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // 📘 Send it to your error tracker (Sentry, Datadog…) here. Day 12 adds instrumentation.
    console.error(error);
  }, [error]);

  // 📘 retry() asks the server to render this segment again and swaps the result
  // in if it works. (The older reset() only re-renders on the client, which can't
  // fix an error that happened on the server.)
  return <ErrorPanel title="This page couldn't be loaded" error={error} retry={retry} />;
}
