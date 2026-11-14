// 📘 Day 10: an error.tsx INSIDE a slot. When the stats fail, only this box is
// replaced. Your posts and the comments slot still render.
// Without this file, the error would go up to app/error.tsx and replace the
// whole dashboard. Try it: set chaos.dashboardStats = 1 in src/lib/chaos.ts.
'use client';

import { useEffect } from 'react';

export default function StatsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm">
      <p className="text-red-600">Your numbers couldn&apos;t be loaded.</p>
      <button type="button" onClick={() => retry()} className="font-medium hover:underline">
        Try again
      </button>
    </div>
  );
}
