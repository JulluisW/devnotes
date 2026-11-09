// 📘 Day 4: a fake THIRD-PARTY service (think Plausible, PostHog, Google Analytics).
// It's separate from our DB on purpose: in real apps the thing most likely to
// fail is a service you don't control. It's slow, and with `chaos.analytics > 0`
// it fails like a real API having a bad day.
import 'server-only';
import { chaos } from './chaos';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const analytics = {
  async readersNow(): Promise<number> {
    console.log('[analytics] → readersNow()');
    await sleep(300);
    if (Math.random() < chaos.analytics) {
      console.log('[analytics] ✗ readersNow() failed: 503 Service Unavailable');
      throw new Error('Analytics API responded 503 Service Unavailable');
    }
    console.log('[analytics] ← readersNow()');
    return 10 + Math.floor(Math.random() * 20);
  },
};
