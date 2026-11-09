// 📘 Day 4: a NESTED error boundary. The closest error.tsx above the failure wins.
//
// Without this file, a failing post would bubble up to app/error.tsx, which sits
// ABOVE posts/layout.tsx, so the whole posts layout would be replaced: the
// "All posts" sidebar disappears and the Scratchpad loses its text.
//
// With this file, the boundary sits INSIDE posts/layout.tsx. Only the main
// column is replaced. The sidebar and Scratchpad survive, so the reader can
// click another post right away.
//
//   RootLayout
//   └ app/error.tsx boundary
//     └ PostsLayout (sidebar + Scratchpad)   ← stays mounted
//       └ app/posts/error.tsx boundary       ← catches /posts and /posts/[slug]
//         └ page
//
// Note: this file does NOT catch errors thrown by posts/layout.tsx itself (for
// example the sidebar's <PostLinks>). Those go up to app/error.tsx.
'use client';

import { useEffect } from 'react';
import { ErrorPanel } from '@/components/error-panel';

export default function PostsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorPanel title="This post couldn't be loaded" error={error} retry={retry} />;
}
