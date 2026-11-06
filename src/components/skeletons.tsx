// 📘 Day 2: Fallbacks for <Suspense>. With Cache Components these become part
// of the static shell: users see them instantly while the data streams in.
// Good skeletons mirror the final layout so nothing jumps when data arrives.
const bar = 'rounded bg-foreground/10';

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid animate-pulse gap-4" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-foreground/10 p-5">
          <div className={`h-3 w-40 ${bar}`} />
          <div className={`h-5 w-2/3 ${bar}`} />
          <div className={`h-4 w-full ${bar}`} />
        </div>
      ))}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className={`h-4 w-48 ${bar}`} />
      <div className={`h-8 w-3/4 ${bar}`} />
      <div className={`h-24 ${bar}`} />
    </div>
  );
}

export function AuthorCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg border border-foreground/10 p-4" aria-hidden>
      <div className="size-12 rounded-full bg-foreground/10" />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-32 ${bar}`} />
        <div className={`h-3 w-2/3 ${bar}`} />
      </div>
    </div>
  );
}

export function LinkListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="mt-2 animate-pulse space-y-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={`h-4 ${bar}`} />
      ))}
    </ul>
  );
}
