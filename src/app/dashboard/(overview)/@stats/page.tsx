// 📘 Day 10: the @stats SLOT. It's a normal page file, but it arrives in the
// layout as the `stats` prop instead of `children`.
// It reads the session cookie (through the DAL), so it needs a <Suspense>
// boundary. The loading.tsx next to this file provides it.
import { getMyStats } from '@/data/dashboard';

export default async function StatsSlot() {
  const stats = await getMyStats();

  const items = [
    { label: 'Published', value: stats.published },
    { label: 'Drafts', value: stats.drafts },
    { label: 'Likes', value: stats.likes },
    { label: 'Comments', value: stats.comments },
  ];

  return (
    <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-foreground/10 p-4">
          <p className="text-xs text-foreground/50">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
