# Day 12: Production (getting the app ready for real users)

**In one sentence:** Today DevNotes gets five things a real website needs:
1. it **checks its settings** when it starts
2. it **writes every server error** to the terminal as one line you can search
3. it sends **security headers** that tell the browser to turn off risky features
4. it has a **health check** URL
5. it has **18 automatic tests**: 11 that check single functions, and 7 that click through the app in a real browser

The tests prove that the important features from Days 4–10 still work.

Branch: `day-12-production` (built on top of `day-11-performance`).

> 🔁 **To try it:** `git switch day-12-production`, then `npm install` (it downloads the new test tools), then:
> ```bash
> npm test
> ```
> ```bash
> npm run test:e2e
> ```
> `test:e2e` runs `next build` first, and that build replaces the `.next` folder your server uses. **Stop your 3005 server before you run it.**

---

## 📖 Words you'll see today

Read this table once before the lesson, then come back whenever a word is unclear. Each word is explained again, briefly, where it first appears.

### Settings and secrets

| Word | What it means |
|---|---|
| **Production** | The real website that real visitors use. The opposite is **development**, the copy on your laptop (`next dev`). |
| **Environment** | The machine, and its settings, that the app is running on: your laptop, a test server, or the production server. |
| **Environment variable** ("env var") | A named setting, `NAME=value`, that the app reads **from the machine** instead of from the code. The same code can then run on different machines with different values. |
| **`process.env`** | The Node.js object that holds all environment variables. `process.env.SITE_URL` gives the value of `SITE_URL`, or `undefined` if it isn't set. |
| **`.env.local`** | A text file of `NAME=value` lines on your laptop. Next.js reads it into `process.env` when it starts. It's in `.gitignore`, so it never goes into git. |
| **Secret** | A value that must stay private, like a password or a key. Anyone who has it can act as your app. |
| **Webhook** | A URL on your site that **another service** calls to tell you something happened. Our `/api/revalidate` (Day 8) is one: the CMS calls it when a post changes. The secret proves the call really came from the CMS. |
| **CMS** | Content Management System. The admin tool where editors write posts (WordPress, Contentful…). DevNotes only pretends to have one. |
| **Schema** | A list of rules that data must follow ("must be a URL", "at least 16 characters"). |
| **zod** | The library we use to write schemas (also used on Day 7 for forms). `safeParse` checks data and says what's wrong, without crashing. |
| **`server-only`** | A package. Put `import 'server-only'` at the top of a file and the build **fails** if browser code ever imports that file. |
| **Build time** | When `next build` runs, once, before the app starts. |
| **Run time** | When the server is running and answering requests, after the build. |
| **Inline** | To paste a value directly into the code. `NEXT_PUBLIC_` values are pasted into the browser JavaScript at build time. |

### Logging and errors

| Word | What it means |
|---|---|
| **Instrumentation** | Code that watches the app while it runs: when it starts, and when errors happen. In Next.js, it's the special file `src/instrumentation.ts`. |
| **Log** | Text the server prints while it runs (`console.log`, `console.error`). On a real host, logs are saved and you can search them. |
| **JSON line** | A log message printed as one line of JSON: `{"level":"error","path":"/dashboard",…}`. Log tools can filter by each field, for example "all errors on /dashboard". |
| **Digest** | A short ID number Next.js gives each server error. The visitor sees it as "Reference: 1234…" (Day 4), and the same number is in the log, so you can find the exact error a user reported. |
| **Error tracker** | A paid service (Sentry, Datadog…) that collects errors from your server, groups them and emails you. |

### Tests

| Word | What it means |
|---|---|
| **Automated test** | Code that uses your app and checks the result. If something breaks, the test fails and tells you what. |
| **Unit test** | Tests **one function** on its own: give it an input, check the output. Very fast, with no browser and no server. |
| **End-to-end test** ("e2e") | Opens a **real browser**, visits the real running app and clicks like a visitor. It tests the whole thing from one end (the browser) to the other (the server). Slower, but closest to reality. |
| **Vitest** | The tool that runs our unit tests (`npm test`). |
| **Playwright** | The tool that runs our end-to-end tests. It controls a real Chrome. |
| **`describe` / `it`** | `describe('parseSearchParams', …)` names a group of tests. `it('uses page 1 when…', …)` is one test, written as a sentence. |
| **`expect(…)`** | "I expect this value to…". It's followed by a check like `.toBe(1)`. If the check is false, the test fails. A check like this is called an **assertion**. |
| **`toBe` / `toEqual`** | `toBe` checks that two values are exactly the same (numbers, strings). `toEqual` checks that two **objects have the same contents**. `{a:1}` is `toEqual` to `{a:1}`, but not `toBe`, because they're two different objects. |
| **`getByRole`** | Finds an element by what it **is** (a link, a button, a heading) and its visible text, not by a CSS class. |
| **Screen reader** | Software that reads the page aloud for blind users. It also finds elements by role and text, which is why `getByRole` is a good habit. |
| **Stub** | A fake, empty version of a file, used only in tests. |
| **Alias** | "When code imports X, load Y instead." We use it to swap `server-only` for the stub in tests. |
| **CI** (Continuous Integration) | A server that runs your tests automatically on every push, for example **GitHub Actions**. |

### HTTP and servers

| Word | What it means |
|---|---|
| **Request / response** | The browser sends a request ("GET /posts"), and the server sends back a response (a status code + headers + the page). |
| **Status code** | A number at the top of the response. `200` OK. `307`/`308` redirect (go to another URL; 308 = moved forever). `404` not found. `500` the server broke. |
| **Header** | A `Name: value` line sent with a request or response, but not shown on the page. Example: `Location: /posts/new-url` on a redirect. |
| **`curl -I <url>`** | A terminal command that requests a URL and prints only the status code and the response headers. |
| **Security header** | A response header that tells the browser to **turn off** a feature that attackers could misuse. |
| **`<iframe>`** | An HTML tag that shows **another website inside your page**, like a window. |
| **Referrer** | When you click a link to another site, the browser tells that site which page you came from (the "referrer"). |
| **MIME type** | The label that says what a file is: `text/html`, `image/png`, `application/javascript`. |
| **Health check** | A URL that just answers "I'm alive" (`200`). Hosting platforms call it every few seconds to see if the server still works. |
| **Uptime** | How long the server has been running without a restart. |
| **Deploy** | Put your app on a server on the internet, so real visitors can use it. |
| **Host / hosting** | The company or machine that runs your app (Vercel, a VPS, AWS…). |
| **VPS** | Virtual Private Server: a rented Linux machine in a data center. You install and run everything on it yourself. |
| **Nginx / reverse proxy** | A program in front of your Next.js server. It receives visitors on port 80/443 (HTTPS) and passes the requests on to `next start` on port 3000. |
| **Docker / container** | A way to pack your app **and everything it needs** (Node, files) into one box, the "image", that runs the same on any machine. |
| **Kubernetes, Fly.io, Railway** | Services that run Docker containers for you. |

---

## ⭐ Must know (4 things)

| # | What | File | Its job, in one line |
|---|---|---|---|
| 1 | Environment variables | `src/lib/env.ts`, `.env.example` | settings that are different on each machine (secrets, URLs), **checked once** |
| 2 | `instrumentation.ts` | `src/instrumentation.ts` | code that runs when the server **starts**, and on every server **error** |
| 3 | Tests | `src/**/*.test.ts`, `e2e/*.spec.ts` | prove the features still work after every change |
| 4 | Production basics | `next.config.ts`, `app/api/health/route.ts` | security headers, a health check, and how to deploy |

Everything after the "Details" heading is **OK to skip for now**.

---

## 1. Environment variables

**The problem:** some values must be **different on each machine**:
- `SITE_URL` is `http://localhost:3005` on your laptop, but `https://devnotes.com` in production.
- `CMS_WEBHOOK_SECRET` is a password. It must never be written in the code, because the code is in git, and everyone who can see the repo would see the password.

**The solution:** the code only says "read the setting called `SITE_URL`". Each machine provides its own value: your laptop in `.env.local`, the production server in its hosting dashboard.

**Where Next.js looks for the value** (it stops at the first place that has it):

| Order | Where | Typical use |
|---|---|---|
| 1 | the real environment: `SITE_URL=… npm start` in the terminal, or the host's dashboard | production |
| 2 | `.env.production.local` / `.env.development.local` | one machine, one mode only |
| 3 | `.env.local` | your laptop (in `.gitignore`, so never in git) |
| 4 | `.env.production` / `.env.development` | shared defaults for one mode |
| 5 | `.env` | shared defaults |

("Mode" means `next dev` = development, and `next build` / `next start` = production.)

**What changed in DevNotes:**

- **`.env.example`, which IS in git.** It lists every variable the app needs, with fake values. A new developer copies it and puts the real values in:
  ```bash
  cp .env.example .env.local
  ```
- **`src/lib/env-schema.ts` holds the rules,** written with zod:
  - `SITE_URL` must be a URL. If it's missing, it uses `http://localhost:3005`.
  - `CMS_WEBHOOK_SECRET` must be at least 16 characters.
- **`src/lib/env.ts` reads `process.env` once,** checks it against the rules, and exports a checked object called `env`. The rest of the code uses `env.SITE_URL` instead of `process.env.SITE_URL`. That gives us two things:
  - TypeScript knows `env.SITE_URL` is always a `string`. `process.env.SITE_URL` is `string | undefined`.
  - a bad value stops the app **with a clear message**, not with a strange crash later on some page.
- **`env.ts` starts with `import 'server-only'`.** If a Client Component (browser code) ever imports it, `next build` fails. So the secret can't end up in the browser by accident.

**Measured:** I started the server with `CMS_WEBHOOK_SECRET=short`. Every page returned **500** (server error), and the terminal said:
```
Invalid environment variables:
  - CMS_WEBHOOK_SECRET: must be at least 16 characters
Copy .env.example to .env.local and fill it in.
```
Without this check, the site would look fine until the first webhook call failed, maybe days later, with a confusing error.

**`NEXT_PUBLIC_`: values the browser is allowed to see.**
- Normal env vars exist **only on the server**. Browser code can't read them.
- A variable whose name starts with `NEXT_PUBLIC_` is different: at `next build`, Next.js **pastes its value into the JavaScript files** sent to the browser. Anyone can open DevTools and read it.
- So: use it only for values that are fine to be public (for example a Google Analytics ID). **Never for secrets.**
- The value is pasted in once, at build time, so changing it later needs a new `next build`.

**Normal (server) variables are read while the server runs,** not at build time. Example: `chaos.dashboardStats` now reads `CHAOS_DASHBOARD_STATS`, so this breaks the stats slot **without a rebuild** (measured):
```bash
CHAOS_DASHBOARD_STATS=1 npx next start -p 3005
```
(Putting `NAME=value` in front of a command sets that variable for that one command only.)

## 2. `instrumentation.ts`: startup and errors

`src/instrumentation.ts` is a **special file name**, like `page.tsx` or `layout.tsx`. Next.js looks for two functions in it:

```ts
export async function register() {             // runs ONCE, when the server starts
  const { env } = await import('./lib/env');   // importing env.ts runs the check from section 1
  console.log(`[startup] environment OK (SITE_URL=${env.SITE_URL})`);
}

export const onRequestError = async (error, request, context) => {  // runs on EVERY server error
  console.error(JSON.stringify({ level: 'error', message, digest, path, route, kind }));
};
```

- **`register()`** is the place for "do this once before serving anyone". Here it runs the settings check and prints `[startup] environment OK`.
- **`onRequestError`** is called by Next.js whenever something throws on the server: a page, a Server Action, a route handler, or the proxy. We print the error as **one JSON line** (explained in the word list), so log tools can search it by field.

**Measured** with `CHAOS_DASHBOARD_STATS=1`, logged in as Maya: the visitor saw the friendly "Your numbers couldn't be loaded" box (Day 10's `@stats/error.tsx`). The terminal got:
```json
{"level":"error","message":"Stats failed (chaos.dashboardStats)","digest":"3272048646","path":"/dashboard?_rsc=","method":"GET","route":"/dashboard","kind":"render"}
```
What each field means:
- `message`: the error text.
- `digest`: the error's ID. The visitor sees the same number as "Reference" (Day 4).
- `path`: the URL that was requested. `?_rsc=` means it was a client-side navigation, not a full page load.
- `method`: `GET` = reading a page; `POST` = sending a form or action.
- `route`: which route file handled it.
- `kind`: `render` (a page), `route` (a route handler), `action` (a Server Action) or `proxy`.

Two things to remember:
- **An error that `error.tsx` shows nicely is still logged here.** The visitor sees a friendly message, and you still find out that something broke.
- In a real app, this function sends the error to an **error tracker** (Sentry and similar) instead of `console.error`.

## 3. Tests

**Why:** after every change, you would have to click through the whole app by hand to be sure nothing broke. Tests do that clicking and checking for you, in seconds, every time.

There are two kinds, for two jobs:

| | Unit tests (Vitest) | End-to-end tests (Playwright) |
|---|---|---|
| what it tests | one function: input → output | a real browser using the real app |
| speed | 11 tests in **0.3 seconds** | 7 tests in **8 seconds** (plus a build first) |
| files | `src/**/*.test.ts`, next to the code they test | `e2e/*.spec.ts` |
| run with | `npm test` | `npm run test:e2e` |
| good for | rules: URL cleaning, env rules, password hashing | user flows: search → modal, login → dashboard, status codes |

**A unit test** (`src/app/search/search-params.test.ts`), read line by line:
```ts
it('uses page 1 when page is missing, not a number, zero or negative', () => {   // the test's name
  expect(parseSearchParams({ page: 'abc' }).page).toBe(1);   // input ?page=abc → expect page 1
  expect(parseSearchParams({ page: '-3' }).page).toBe(1);    // input ?page=-3  → expect page 1
});
```
`npm test` runs it. If `parseSearchParams` ever returned something other than `1`, the test would fail and print what it got instead.

**An end-to-end test** (`e2e/search-modal.spec.ts`), read line by line:
```ts
await page.goto('/search?q=routing');                                     // open this URL in Chrome
await page.getByRole('link', { name: 'Layouts That Persist' }).click();  // click the link with this text
await expect(page).toHaveURL('/posts/layouts-that-persist');             // the URL must now be this
await expect(page.getByRole('dialog').getByRole('heading', { name: 'Layouts That Persist' })).toBeVisible();
//                    ↑ inside the modal (a <dialog>), a heading with this text must be visible
```
`getByRole('link', { name: … })` finds elements by what they **are** and **what they say**, the way a visitor sees them, not by CSS class. So the test still passes after a redesign.

**What the 18 tests cover:**
- Day 4: a missing post → 404; an old URL → 308 redirect
- Day 9: logged out → 307 redirect to `/login`; login → dashboard → logout; password hashing
- Day 10: search, pagination, the modal, closing it with Esc, a full page load
- Day 12: the security headers and the env rules

**A test found something (measured):** the 308 redirect sends the `Location` header **twice**, with the same value. The Day 10 build does it too, so the cause is Next.js 16.4.5, not our code. Browsers handle it fine, so the test now checks that the header **contains** the URL instead of **equals** it. That's the point of tests: they notice things nobody looks at.

**Why no unit tests for pages?** Vitest can't render `async` Server Components (the Next.js docs say so). Pages are tested end to end instead.

## 4. Production basics

### Security headers

Set in `next.config.ts` with `headers()`, so they're added to **every response**. Checked with `curl -I`.

| Header | What it turns off |
|---|---|
| `X-Content-Type-Options: nosniff` | **MIME sniffing.** Without it, the browser may guess a file's type from its contents. An attacker could upload a "picture" that is really JavaScript, and the browser might run it. `nosniff` = trust the declared type, never guess. |
| `X-Frame-Options: DENY` | **Clickjacking.** An attacker's site loads DevNotes in an invisible `<iframe>` on top of a fake button. You think you click their button, but you really click "Delete" on DevNotes. `DENY` = no site may show DevNotes in an iframe. |
| `Referrer-Policy: strict-origin-when-cross-origin` | **Leaking URLs.** When a visitor clicks a link to another site, the browser sends only `https://devnotes.com`, not the full URL with `?q=what-they-searched`. |
| `Permissions-Policy: camera=(), microphone=(), geolocation=()` | **Device access.** No script on the page (even a bad third-party one) can ask for the camera, microphone or location. The empty `()` means "allowed for nobody". |
| `poweredByHeader: false` | **Advertising your tech.** Next.js normally sends `X-Powered-By: Next.js`. That tells attackers which bugs to try. Now the header is gone. |

### Health check (`/api/health`)

A tiny route handler that returns `{ "status": "ok", "uptimeSeconds": 42 }`. Hosting platforms and **uptime monitors** (services that ping your site and alert you when it's down) call it every few seconds. If it stops answering 200, they restart the server or send you an alert.

**Measured trap:** without `await connection()`, the build marked it **○ (static)**. That means the JSON was created **once, at build time**, and every call got that same old answer, "ok" even if the server were broken. `await connection()` tells Next.js "this needs a real request, so run it every time". With it, the build shows **ƒ (dynamic)**, and `uptimeSeconds` changes on every call.

### How to deploy (pick one)

| Where | How | Good for |
|---|---|---|
| **Vercel** (the company that makes Next.js) | connect your GitHub repo, and set the env vars in their dashboard. Every push deploys. | the easiest. Every Next.js feature works, including a cache shared by many servers. |
| **Any Node server** (a VPS) | on the server: `npm ci && npm run build && npm start`, with Nginx in front for HTTPS | full control, you manage everything |
| **Docker** | add `output: 'standalone'` to `next.config.ts`. The build then creates a small folder with only the files needed to run, which you put in a container. | Kubernetes, Fly.io, Railway… |

(`npm ci` = install exactly what `package-lock.json` says, nothing else. It's the safe choice on servers. `npm install` may update the lockfile.)

---

## ⚠️ What DevNotes still can't do in production

DevNotes works fine as a learning app. A real launch would need to fix these:

- **The database lives in memory** (`src/lib/db.ts`). A server restart deletes every comment, like and login session. A real app uses a real database (Postgres, MySQL…). Only `src/lib/db.ts` would change, because all data goes through the DAL (Day 2). That's the payoff of the DAL.
- **More than one server** means more than one memory, and more than one `'use cache'` store. Each server would have different data. Real apps fix this with a shared database and a shared cache.
- **The webhook secret and the demo password** are learning values. Real ones are long and random, and live only in the host's settings, never in a file.

---

## Details (OK to skip for now)

- **The Next.js production checklist** (in the docs: `guides/production-checklist.md`). Already done in DevNotes:
  - `<Link>` for every internal link (Day 1)
  - Server Components by default (Day 1)
  - cached data with tags (Days 3 and 7)
  - error and not-found pages (Day 4)
  - metadata, sitemap and robots (Days 5 and 6)
  - auth checks in the DAL (Day 9)
  - `next/image`, `next/font` and `next/script` (Day 11)
  - typed routes (Day 1)
  - env vars that never reach the browser (Day 12)

  Not done: a **Content Security Policy** (CSP), a header that lists exactly which scripts, styles and images the page may load. It blocks a lot of attacks, but it's strict and easy to get wrong (one missing entry and your own scripts stop working). Read the docs guide before adding one.
- **`.env*` + `!.env.example` in `.gitignore`:** the first line ignores every file starting with `.env`. The `!` line makes one exception, so the example file can be committed.
- **Playwright uses the Chrome you already have** (`channel: 'chrome'` in `playwright.config.ts`), so there's no 150 MB browser download. On a CI server, which has no Chrome, run `npx playwright install chromium` and remove that line.
- **`webServer` in `playwright.config.ts`:** before the first test, Playwright starts `next start -p 3200` by itself and waits until `/api/health` answers. That's a second job for the health check.
- **`server-only` in tests:** that package throws an error on purpose when it runs outside Next.js. Vitest isn't Next.js, so `vitest.config.mts` uses an **alias** to swap it for an empty **stub** file (`src/test/server-only-stub.ts`).
- **`@types/node`** (the TypeScript types for Node.js) went from `^20` to `^22`. Vitest 5 needed it, and it matches the Node you have installed (v22).

---

## Cheat sheet

| I want… | Write… |
|---|---|
| a secret or a per-machine setting | add it to `.env.example` + `env-schema.ts`, and set the real value in `.env.local` |
| to use it | `import { env } from '@/lib/env'` (server code only) |
| a value the browser can read | `NEXT_PUBLIC_…` (never a secret; frozen at build) |
| code that runs when the server starts | `register()` in `src/instrumentation.ts` |
| to hear about every server error | `onRequestError` in `src/instrumentation.ts` |
| to test a function | `src/…/x.test.ts` with `describe` / `it` / `expect`, then `npm test` |
| to test a user flow | `e2e/x.spec.ts` with `page.goto`, `getByRole`, `expect`, then `npm run test:e2e` |
| security headers | `headers()` in `next.config.ts` |
| a health check | a GET route handler with `await connection()` |
| ❌ `process.env.X` everywhere in the code | ✅ one checked `env` object |
| ❌ secrets in `NEXT_PUBLIC_` or in git | ✅ `.env.local` / the host's settings |

---

## 📝 Homework (the last one!)

1. **Break the settings (predict first).** In `.env.local`, change the secret to `abc`. Then run `npx next start -p 3005` (no rebuild needed). What does the terminal say, and what does the browser show? Because…? Put the secret back afterwards.
2. **Write one unit test.** In `src/app/search/search-params.test.ts`, add a test: `parseSearchParams({ q: 'ROUTING', page: '3' })` should give `{ q: 'routing', page: 3 }`. Use `toEqual`, because you're comparing whole objects. Run `npm test`.
3. **Make a test fail on purpose.** In `e2e/status-codes.spec.ts`, change `toBe(404)` to `toBe(200)`. Stop your 3005 server and run `npm run test:e2e`. Read the error: what did Playwright expect, and what did it get? Change it back afterwards.
4. **Theory.** Why is `CMS_WEBHOOK_SECRET` NOT named `NEXT_PUBLIC_CMS_WEBHOOK_SECRET`? What would happen if it were?

---

## ✅ Homework review

1. **✅ Correct**, with one small correction. `register()` runs at startup and throws, but the server **still starts**: the terminal says "Ready", and then **every request** gets a 500 ("Internal Server Error") with the zod message in the terminal (`CMS_WEBHOOK_SECRET: must be at least 16 characters`). So it isn't "Next refuses to start". It's "Next starts, but every page fails until the setting is fixed". Either way, you find out immediately, and the message tells you exactly what's wrong.
2. **✅ Correct.** `toEqual({ q: 'routing', page: 3 })` passes. You added it as an extra `expect` inside the existing "cleans the query" test, so the count stayed at 11. As its own `it('…', () => {…})` it would show as test 12, and a failure would name it exactly. Both are fine.
3. **⚠️ The test name is right, but the reason is mixed up with Day 4.** The 404 page is **not** broken. The test failed because **you changed what it expects**:
   ```
   Expected: 200
   Received: 404
   ```
   - **Expected** = the value you wrote in `toBe(…)`, which was 200 after your change.
   - **Received** = what the server really sent: a correct 404.

   The Day 4 problem you remembered (the streamed shell went out with 200 before `notFound()` ran, and `ensureStatic = 'navigation'` fixed it) is **exactly what this test protects**. If that bug ever came back, this test (with `toBe(404)`) would fail with "Expected: 404, Received: 200". So your memory of Day 4 is correct. It's the reason the test exists, not the reason it failed today.
4. **✅ Correct reason, missing the "what would happen".** `NEXT_PUBLIC_` values are pasted into the browser JavaScript at build time. What would happen: anyone could open DevTools → Sources, search the JS files and find the secret. With it, they could call `/api/revalidate` themselves, pretending to be the CMS, and empty the cache whenever they want. Small fix: it's not "so **Google** can access it". `NEXT_PUBLIC_` is for **any** value your browser code needs and that's fine to be public, like an analytics ID, a public map key or the site name.

---

## 🎓 After Day 12

When all the homework is reviewed, we'll write the **whole-course summary**: what each day taught, your weak points and how they changed, and a "first real project" checklist.
