// 📘 Day 4: FAILURE SWITCHES for practicing error UI.
// Each value is a failure rate: 0 = never fails, 0.5 = fails half the time, 1 = always fails.
//
// How to use it (with `next dev` running):
//   1. Change a value and save. Next.js reloads this module, and dev caches reset on save.
//   2. Reload the page and watch which error boundary catches the failure.
//   3. Set it back to 0 when you're done.
//
// ⚠️ Keep everything at 0 when you run `npm run build`. The build runs these
// queries to prerender pages, and an error during prerendering fails the build.
export const chaos = {
  /** The fake analytics API behind the "developers reading now" badge on `/`. */
  analytics: 0,
  /** `db.posts.findBySlug`, the query behind the body of every post page. */
  postBySlug: 0,
  /** Day 10: the numbers in the dashboard's @stats slot. Only that slot breaks. */
  dashboardStats: 0,
};
