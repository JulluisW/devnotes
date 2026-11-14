// 📘 Day 11: CORE WEB VITALS, the speed numbers Google uses for ranking.
//   LCP  Largest Contentful Paint: when did the main content (the cover image) appear?   good ≤ 2.5 s
//   CLS  Cumulative Layout Shift: how much did things jump around while loading?           good ≤ 0.1
//   INP  Interaction to Next Paint: after a click, how long until the screen reacts?      good ≤ 200 ms
// This logs them in the browser console (DevTools → Console). A real site would
// send them to an analytics service instead of console.log.
'use client';

import { useReportWebVitals } from 'next/web-vitals';

// Defined OUTSIDE the component: the docs ask for a callback that never changes,
// otherwise the same numbers get reported more than once.
function logMetric(metric: { name: string; value: number; rating?: string }) {
  const value = metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)} ms`;
  console.log(`[web-vitals] ${metric.name} ${value} (${metric.rating ?? 'n/a'})`);
}

export function WebVitals() {
  useReportWebVitals(logMetric);
  return null;
}
