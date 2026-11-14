// 📘 Day 10: PARALLEL ROUTES. This layout gets 3 pages at once, as 3 props:
//
//   children  ← (overview)/page.tsx           your account bar + your posts
//   stats     ← (overview)/@stats/page.tsx    the numbers
//   comments  ← (overview)/@comments/page.tsx comments on your posts
//
// A folder that starts with @ is a SLOT. It is not part of the URL: all three
// render at /dashboard. Each slot is a real page, so it can have its OWN
// loading.tsx and error.tsx. One slow or broken slot doesn't hold back or break
// the others (try chaos.dashboardStats = 1 in src/lib/chaos.ts).
//
// 📘 Day 10: ROUTE GROUP. The (overview) folder is also not part of the URL.
// It exists so this layout wraps /dashboard ONLY. /dashboard/settings sits
// outside the group, so it doesn't get the slots. Without the group, settings
// would need a default.tsx in every slot (see lessons/day-10-advanced-routing.md).
export default function DashboardOverviewLayout({ children, stats, comments }: LayoutProps<'/dashboard'>) {
  return (
    <div className="space-y-8">
      {children}
      {stats}
      {comments}
    </div>
  );
}
