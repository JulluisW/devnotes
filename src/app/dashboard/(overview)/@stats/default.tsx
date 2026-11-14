// 📘 Day 10: default.tsx = what a slot shows when it has no page for the
// current URL, after a full page load. Next.js 16 REQUIRES one in every slot
// (the build fails without it).
// Inside the (overview) group the only URL is /dashboard, which this slot
// has a page for, so this file never shows. It's here because the build needs it.
export default function StatsDefault() {
  return null;
}
