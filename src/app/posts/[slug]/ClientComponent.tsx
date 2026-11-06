'use client';

import { PostSummary } from '@/data/posts';
import Link from 'next/link';
import { use } from 'react';

export function ClientComponent({ promise }: { promise: Promise<PostSummary[]> }) {
  const data = use(promise); // ⏸ suspends → <Suspense fallback> shows until resolved

  if (!data) {
    return null;
  }

  return (
    <div>
      <h2 className="mt-10 text-xl font-semibold">Tags</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data[0].tags.map((tag) => (
          <li key={tag}>
            <Link href={`/tags/${tag}`} className="text-foreground/70 hover:text-foreground hover:underline">
              {tag}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
