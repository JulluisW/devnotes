// 📘 Day 12: ONE place that reads process.env. Everything else imports `env`.
//   - checked once, when the server starts (instrumentation.ts) and when
//     `next build` runs: a missing or bad value stops it with a clear message,
//     instead of a confusing crash later on some page
//   - typed: env.SITE_URL is a string, not `string | undefined`
//   - 'server-only': these values are secrets. If a Client Component ever
//     imports this file, the BUILD fails, so they can't leak into the browser.
//
// Values come from (first match wins): the real environment (your hosting
// dashboard), .env.production.local, .env.local, .env.production, .env.
import 'server-only';
import { parseEnv } from './env-schema';

export const env = parseEnv(process.env);
