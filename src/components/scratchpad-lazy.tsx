// 📘 Day 11: LAZY LOADING with next/dynamic.
//   - The Scratchpad's code is split into its own file (a "chunk"). It isn't
//     part of the JavaScript every page downloads first.
//   - ssr: false → the server renders only the `loading` placeholder. The real
//     component renders in the browser, where localStorage exists.
// `ssr: false` is only allowed inside a Client Component, which is why this tiny
// wrapper file exists. posts/layout.tsx (a Server Component) imports this one.
'use client';

import dynamic from 'next/dynamic';

export const LazyScratchpad = dynamic(() => import('./scratchpad').then((mod) => mod.Scratchpad), {
  ssr: false,
  // Same height as the real thing, so the sidebar doesn't jump when it appears.
  loading: () => <div className="h-[124px] animate-pulse rounded-md bg-foreground/5" aria-hidden />,
});
