# Day 12: Production (settings, monitoring, tests, shipping)

**In one sentence:** DevNotes now checks its settings when it starts, logs every server error as one searchable line, sends security headers, has a health-check URL, and has **18 automatic tests** (11 unit + 7 in a real browser) that prove the important features from Days 4–10 still work.

Branch: `day-12-production` (from `day-11-performance`).

> 🔁 **To try it:** `git switch day-12-production`, `npm install` (new test tools), then:
> ```bash
> npm test
> ```
> ```bash
> npm run test:e2e
> ```
> `test:e2e` runs `next build` first, which replaces the `.next` folder. **Stop your 3005 server before running it.**

---

## ⭐ Must know (4 things)

| # | What | File | One-line job |
|---|---|---|---|
| 1 | Environment variables | `src/lib/env.ts`, `.env.example` | settings that change per machine (secrets, URLs), **checked once** |
| 2 | `instrumentation.ts` | `src/instrumentation.ts` | code that runs when the server **starts**, and on every server **error** |
| 3 | Tests | `src/**/*.test.ts`, `e2e/*.spec.ts` | prove that features still work after every change |
| 4 | Production basics | `next.config.ts`, `app/api/health/route.ts` | security headers, a health check, and how to deploy |

Everything after the "Details" heading is **OK to skip for now**.

---

## 1. Environment variables

**What they are:** values that differ between your laptop and the real server. Secrets (the webhook password) and addresses (the site URL). They never go in the code or in git.

**Where Next.js looks** (first match wins):

| Order | Source | Typical use |
|---|---|---|
| 1 | the real environment (`SITE_URL=… npm start`, or your host's dashboard) | production |
| 2 | `.env.production.local` / `.env.development.local` | per machine and mode |
| 3 | `.env.local` | your laptop (in `.gitignore`) |
| 4 | `.env.production` / `.env.development` | shared defaults per mode |
| 5 | `.env` | shared defaults |

**What changed in DevNotes:**
- `.env.example` **is** in git: the list of variables with fake values. A new developer runs `cp .env.example .env.local` and fills it in.
- `src/lib/env-schema.ts` has the rules (zod, Day 7): `SITE_URL` must be a URL, `CMS_WEBHOOK_SECRET` must be at least 16 characters.
- `src/lib/env.ts` reads `process.env` **once**, checks it, and exports `env`. `site.ts` and the webhook use `env.SITE_URL` / `env.CMS_WEBHOOK_SECRET` instead of `process.env`.
- `env.ts` starts with `import 'server-only'`: if a Client Component ever imports it, the build fails, so secrets can't reach the browser.

**Measured:** started with `CMS_WEBHOOK_SECRET=short`. Every page returned **500**, and the log said:
```
Invalid environment variables:
  - CMS_WEBHOOK_SECRET: must be at least 16 characters
Copy .env.example to .env.local and fill it in.
```
Without the check, the site would look fine until the first webhook call failed.

**`NEXT_PUBLIC_`:** a variable whose name starts with `NEXT_PUBLIC_` is **copied into the browser JavaScript** at build time. Use it only for values that are OK to be public (an analytics ID). Never for secrets. It's frozen at `next build`: changing it later needs a rebuild.

**Server variables are read when the code runs.** `chaos.dashboardStats` now reads `CHAOS_DASHBOARD_STATS`, so `CHAOS_DASHBOARD_STATS=1 npx next start -p 3005` breaks the stats slot **without a rebuild** (measured).

## 2. `instrumentation.ts`: startup and errors

```ts
export async function register() {             // once, when the server starts
  const { env } = await import('./lib/env');   // runs the check above
  console.log(`[startup] environment OK (SITE_URL=${env.SITE_URL})`);
}

export const onRequestError = async (error, request, context) => {  // every server error
  console.error(JSON.stringify({ level: 'error', message, digest, path, route, kind }));
};
```

**Measured** with `CHAOS_DASHBOARD_STATS=1`, logged in as Maya: the visitor saw the friendly "Your numbers couldn't be loaded" box (Day 10's `@stats/error.tsx`), and the terminal got:
```json
{"level":"error","message":"Stats failed (chaos.dashboardStats)","digest":"3272048646","path":"/dashboard?_rsc=","method":"GET","route":"/dashboard","kind":"render"}
```
- **Errors that an `error.tsx` shows nicely are still logged here.** The visitor sees a nice message, and you still find out.
- **`digest`** is the same "Reference" number the error panel shows (Day 4). A user can report it, and you can search the logs for it.
- In a real app, this function sends the error to an error tracker (Sentry and similar services) instead of `console.error`.

## 3. Tests

Two kinds, for two jobs:

| | Unit tests (Vitest) | End-to-end tests (Playwright) |
|---|---|---|
| tests | one function: input → output | a real browser clicking the real app |
| speed | 11 tests in **0.3 s** | 7 tests in **8 s** (plus a build) |
| files | `src/**/*.test.ts`, next to the code | `e2e/*.spec.ts` |
| run | `npm test` | `npm run test:e2e` |
| use for | rules: URL cleaning, env rules, password hashing | flows: search → modal, login → dashboard, status codes |

**A unit test** (`src/app/search/search-params.test.ts`):
```ts
it('uses page 1 when page is missing, not a number, zero or negative', () => {
  expect(parseSearchParams({ page: 'abc' }).page).toBe(1);
  expect(parseSearchParams({ page: '-3' }).page).toBe(1);
});
```

**An end-to-end test** (`e2e/search-modal.spec.ts`):
```ts
await page.goto('/search?q=routing');
await page.getByRole('link', { name: 'Layouts That Persist' }).click();
await expect(page).toHaveURL('/posts/layouts-that-persist');
await expect(page.getByRole('dialog').getByRole('heading', { name: 'Layouts That Persist' })).toBeVisible();
```
`getByRole('link', { name: … })` finds elements the way a visitor (or a screen reader) sees them, not by CSS class. So the test still passes after a redesign.

**What the tests cover:**
- Day 4: missing post → 404, old URL → 308
- Day 9: logged out → 307 to `/login`, login → dashboard → logout
- Day 10: search, pagination, modal, Esc, full page load
- Day 12: security headers, env rules
- Day 9: password hashing

**A test found something (measured):** the 308 redirect sends the `Location` header **twice**, with the same value. The Day 10 build does it too, so it's Next.js 16.4.5, not our code. Browsers follow it fine, so the test now checks "contains" instead of "equals". That's the point of tests: they notice things nobody looks at.

**Why not unit tests for pages?** Vitest can't render `async` Server Components (the docs say so). Pages are tested end to end.

## 4. Production basics

**Security headers** (`next.config.ts`, measured with `curl -I`):

| Header | Stops |
|---|---|
| `X-Content-Type-Options: nosniff` | a file being run as a different type than it claims |
| `X-Frame-Options: DENY` | other sites showing DevNotes inside an `<iframe>` to trick clicks |
| `Referrer-Policy: strict-origin-when-cross-origin` | sending full URLs (with `?q=…`) to other sites |
| `Permissions-Policy: camera=(), …` | any script using the camera, mic or location |
| `poweredByHeader: false` | advertising "Next.js" to attackers (`X-Powered-By` is gone) |

**Health check** (`/api/health`): monitors call it every few seconds. **Measured trap:** without `await connection()`, the build made it **○ static**, so the answer was frozen at build time and would say "ok" even with the server broken. With it: **ƒ**, and `uptimeSeconds` changes on every call.

**How to deploy** (pick one):

| Where | How | Good for |
|---|---|---|
| Vercel (the company behind Next.js) | connect the GitHub repo, set env vars in the dashboard | the easiest. Every feature works, including caching across servers |
| Any Node server (a VPS) | `npm ci && npm run build && npm start` behind a proxy like Nginx | full control |
| Docker | `output: 'standalone'` in `next.config.ts` → a small folder with only what's needed to run | Kubernetes, Fly.io, Railway… |

---

## ⚠️ What DevNotes still can't do in production

DevNotes runs fine as a learning app. These are the gaps a real launch would need to close:

- **The database is in memory** (`src/lib/db.ts`). A restart loses every comment, like and session. A real app uses a real database (Postgres, MySQL…) through the same DAL. Only `src/lib/db.ts` would change, and that's the reward for the DAL (Day 2).
- **More than one server** = more than one memory, and more than one `'use cache'` store. Each would have different data. A shared database and a shared cache handler fix that.
- **The webhook secret and the demo password** are learning values. Real ones are long and random, and live only in the host's settings.

---

## Details (OK to skip for now)

- **Production checklist** (from the docs, `guides/production-checklist.md`), already done in DevNotes:
  - `<Link>` everywhere (Day 1)
  - Server Components by default (Day 1)
  - cached data with tags (Days 3 and 7)
  - error and not-found pages (Day 4)
  - metadata, sitemap and robots (Days 5 and 6)
  - auth checks in the DAL (Day 9)
  - `next/image`, `next/font` and `next/script` (Day 11)
  - typed routes (Day 1)
  - env vars that never reach the client (Day 12)

  Not done: a Content Security Policy header. It's strict and easy to get wrong, so read the docs guide first.
- **`.env*` in `.gitignore` + `!.env.example`:** the `!` line makes one exception, so the example file can be committed.
- **Playwright uses your installed Chrome** (`channel: 'chrome'`), so there's no 150 MB browser download. On a CI server (automatic tests on every push, e.g. GitHub Actions), run `npx playwright install chromium` and remove that line.
- **`webServer` in `playwright.config.ts`** starts `next start -p 3200` and waits for `/api/health` before the first test. That's a second job for the health check.
- **`server-only` in tests:** that package throws outside Next.js on purpose. `vitest.config.mts` swaps it for an empty file.
- **Vitest 5 needed newer Node types:** `@types/node` went from `^20` to `^22`, to match the installed Node (v22).

---

## Cheat sheet

| I want… | Write… |
|---|---|
| a secret or per-machine setting | add it to `.env.example` + `env-schema.ts`, set it in `.env.local` |
| use it | `import { env } from '@/lib/env'` (server code only) |
| a value the browser can read | `NEXT_PUBLIC_…` (never a secret, frozen at build) |
| run code when the server starts | `register()` in `src/instrumentation.ts` |
| hear about every server error | `onRequestError` in `src/instrumentation.ts` |
| test a function | `src/…/x.test.ts` with `describe` / `it` / `expect`, run `npm test` |
| test a user flow | `e2e/x.spec.ts` with `page.goto`, `getByRole`, `expect`, run `npm run test:e2e` |
| security headers | `headers()` in `next.config.ts` |
| a health check | a GET route handler with `await connection()` |
| ❌ `process.env.X` all over the code | one checked `env` object |
| ❌ secrets in `NEXT_PUBLIC_` or in git | `.env.local` / host settings |

---

## 📝 Homework (the last one!)

1. **Break the settings (predict first).** In `.env.local`, change the secret to `abc`, then run `npx next start -p 3005` (no rebuild needed). What does the terminal say, and what does the browser show? Because…? Put the secret back.
2. **Write one unit test.** In `src/app/search/search-params.test.ts`, add a test: `parseSearchParams({ q: 'ROUTING', page: '3' })` should give `{ q: 'routing', page: 3 }`. Use `toEqual` (it compares whole objects). Run `npm test`.
3. **Make a test fail on purpose.** In `e2e/status-codes.spec.ts`, change `toBe(404)` to `toBe(200)`, stop your 3005 server, and run `npm run test:e2e`. Read the error message: what did Playwright expect, and what did it get? Change it back.
4. **Theory.** Why is `CMS_WEBHOOK_SECRET` NOT named `NEXT_PUBLIC_CMS_WEBHOOK_SECRET`? What would happen if it were?

---

## 🎓 After Day 12

When all homework is reviewed, we'll write the **whole-course summary**: what each day taught, your weak points and how they changed, and a "first real project" checklist.
