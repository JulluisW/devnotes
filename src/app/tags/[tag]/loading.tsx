// 📘 Day 4: loading.tsx = an automatic <Suspense> boundary around this segment's page.
// Next.js turns this folder into:
//
//   <TagLayout?>                               (none here, so the root layout)
//     <Suspense fallback={<Loading />}>        ← this file
//       <TagPage />                            ← now free to be `async` and await at the top
//     </Suspense>
//
// Compare with Day 1–3, where the page itself had to wrap an inner component
// in <Suspense> by hand. Same behavior, less code.
//
// When to use which:
//   loading.tsx   → the WHOLE page depends on data, so there's nothing useful to show without it
//   <Suspense>    → parts of the page can show early (the post page streams its author card later)
// Prefer granular <Suspense> when a page has static parts: a loading.tsx makes the whole
// page area a skeleton.
//
// ⚠️ A loading fallback that gets SENT starts the stream, and that locks the status at 200.
// A notFound() below it becomes a soft 404 (200 + noindex). See posts/[slug]/page.tsx.
import { PostListSkeleton } from '@/components/skeletons';

export default function TagLoading() {
  return (
    <div>
      <div className="h-9 w-64 animate-pulse rounded bg-foreground/10" aria-hidden />
      <div className="mt-8">
        <PostListSkeleton />
      </div>
    </div>
  );
}
