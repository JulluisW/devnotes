// 📘 Day 10: a loading.tsx INSIDE a slot. It only covers this slot, so the
// other parts of the dashboard show up as soon as they're ready.
export default function StatsLoading() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-[74px] rounded-lg border border-foreground/10 bg-foreground/5" />
      ))}
    </div>
  );
}
