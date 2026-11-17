# Course summary: 12 days of Next.js 16

**In one sentence:** in 12 days you took DevNotes from a few static pages to a full app. It has cached data, real status codes, full SEO, likes and comments, a JSON API and RSS, logins, a dashboard with slots, a search with a modal, fast images, and 18 automatic tests.

This page has five parts:
1. the core words of the course
2. what each day taught, with the trap we measured
3. the five ideas that connect everything
4. your weak points, and how they changed over the 12 days
5. a checklist for your first real project

---

## 📖 Core words of the course

These are the words that came back on many days. If one is unclear, the day in brackets explains it in full.

| Word | What it means |
|---|---|
| **Server Component** | The default. It runs **only on the server** and sends HTML. It can read the database directly and adds no JavaScript to the browser. (Day 1) |
| **Client Component** | A file with `'use client'`. It also runs in the browser, so it can use `useState`, `onClick` and `localStorage`. Keep these small. (Day 1) |
| **DAL** (Data Access Layer) | The `src/data/` folder. **All** database reads and writes go through it, and the permission checks live there too. (Days 2, 9) |
| **DTO** (Data Transfer Object) | The plain object the DAL returns: only the fields the page needs, never the whole database row (no password hash). (Day 2) |
| **Static shell** | The part of a page that is built **once at `next build`** and sent instantly to everyone. (Day 3) |
| **Dynamic hole** | A part inside `<Suspense>` that is made **per request** and streamed in after the shell. (Day 3) |
| **○ / ◐ / ● / ƒ** | The build table symbols. ○ fully static. ● static, built for each `generateStaticParams` value. ◐ static shell + dynamic holes. ƒ made on every request. (Days 3, 8) |
| **`'use cache'`** | Saves a function's result. The next call with the **same arguments** reuses it, without touching the database. (Day 3) |
| **`cacheLife`** | How long a cached result may be reused: stale / revalidate / expire. It's a **maximum age checked when a request comes in**, not a timer that refreshes on its own. (Day 3) |
| **`cacheTag`** | A label on a cached result, like `post:my-slug`. Later, you can throw away every result with that label. (Days 3, 7) |
| **`updateTag` / `revalidateTag`** | Throw away cached results with a label. `updateTag`: the next visitor waits for fresh data (use it in Server Actions). `revalidateTag(tag, 'max')`: the next visitor gets the old data once, while a fresh copy is made in the background (webhooks). (Days 7, 8) |
| **Streaming** | The server sends the shell first, then each Suspense part as soon as it's ready, all in one response. (Day 3) |
| **Status code** | 200 OK, 307/308 redirect, 404 not found, 500 server error. Google trusts it more than the page text. (Day 4) |
| **Server Action** | An `async` function with `'use server'` that a form calls. It runs on the server, with no API route needed. (Day 7) |
| **Route Handler** | A `route.ts` file that answers with JSON, XML or anything else instead of a page. For other programs: APIs, RSS, webhooks. (Day 8) |
| **Session / cookie** | After login, the server saves a session and gives the browser a random ID in an `httpOnly` cookie. The browser sends it back on every request. (Day 9) |
| **Proxy** (`proxy.ts`) | Runs before every matched request. Good for a quick "no cookie → go to /login", but **not** the real security check. (Day 9) |
| **Canonical URL** | Tells Google "this is the main address of this page", so copies with `?q=` or other variations don't compete with it. (Day 5) |
| **Open Graph (OG)** | `<meta>` tags that control the preview card (title, picture) when a link is shared on Slack, X or WhatsApp. (Days 5, 6) |
| **Environment variable** | A setting that comes from the machine, not the code: secrets, URLs. (Days 8, 12) |

---

## What each day taught

| Day | Topic | The one idea to keep | The trap we measured |
|---|---|---|---|
| 1 | Foundations | Folders are URLs. Layouts stay mounted. Server Components by default, `'use client'` only at the edges. | A plain `<a>` reloads the whole page. `<Link>` navigates on the client and prefetches. |
| 2 | Data layer | Pages never touch the database. They call the DAL, which returns DTOs. `React.cache` stops one request from asking the database twice. | Two awaits one after the other = slow. `Promise.all` = parallel. |
| 3 | Caching | `'use cache'` + `cacheLife` + `cacheTag` on DAL reads. Uncached reads go inside `<Suspense>`. | `expire` under 5 minutes makes a dynamic hole, so the page turns ◐ instead of ○. |
| 4 | Loading & errors | `loading.tsx`, `error.tsx`, `not-found.tsx`. `notFound()` and `permanentRedirect()`. | A streamed page had **already sent 200** before `notFound()` ran. `ensureStatic = 'navigation'` gives a real 404 on the first visit. |
| 5 | SEO I: Metadata | `metadata` / `generateMetadata`, title template, canonical, Open Graph, `metadataBase`. | Metadata merges **shallowly**: a page's `openGraph` replaces the layout's whole `openGraph`, so spread `baseOpenGraph`. |
| 6 | SEO II: crawlers | `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, JSON-LD. | Pages lost their preview picture (same shallow merge). The OG image route was ƒ (1.3 s) without `generateStaticParams`, and ● (12 ms) with it. |
| 7 | Mutations | Server Actions + `useActionState` + `useOptimistic` + zod. Then `updateTag` the **same tag the reader used**. | Your delete used the wrong tag, and a restart hid the bug. With JavaScript off, a `useActionState` form saves the data, but the response never arrives. |
| 8 | Route Handlers | `route.ts` for JSON, RSS and webhooks. Check the secret, validate with zod, then `revalidateTag`. | Route handlers and pages had **separate copies** of the in-memory database, so the fix was `globalThis`. Reading `request.url` made the route ƒ. |
| 9 | Auth & Proxy | A session cookie (httpOnly) + `requireUser()` in the DAL. Every write checks "is this user allowed?". | A fake cookie passes the proxy and is then stopped by the DAL. **Hiding a button is not security**: anyone can send the POST. |
| 10 | Advanced routing | Route groups `(name)`, slots `@name`, an intercepting modal `(..)`, search state in the URL with `searchParams`. | Next 16 keeps hidden routes mounted, so the dialog came back broken, and the effect cleanup fixed it. A `<Link>` inside the modal gets intercepted again. |
| 11 | Performance | `next/image` (`sizes`, `fetchPriority`), `next/dynamic`, `next/script`, Web Vitals, view transitions. | **Your find:** CLS 0.85 from a short skeleton + the scrollbar appearing. `scrollbar-gutter: stable` + a taller skeleton → 0.003. |
| 12 | Production | A checked `env`, `instrumentation.ts`, security headers, a health check, Vitest + Playwright. | The health check was ○ (frozen at build time) until `await connection()`. A secret that's too short → every request 500. |

---

## The 5 ideas that connect everything

### 1. Every line runs in one place: build, server, or browser

| Where | When | Examples |
|---|---|---|
| **Build** (`next build`) | once, before any visitor | ○ / ● pages, `generateStaticParams`, `NEXT_PUBLIC_` values pasted into the JS |
| **Server, per request** | every visit or action | Suspense holes, `cookies()`, `searchParams`, Server Actions, route handlers, `requireUser()` |
| **Browser** | after the HTML arrives | `'use client'` components: state, clicks, `localStorage`, `useOptimistic` |

Most questions ("why is this ○?", "why can't I read the cookie here?", "why did the build fail?") are answered by asking **where and when does this line run?**

### 2. What happens when a request comes in

```
visitor asks for /posts/my-post
→ proxy.ts                      quick checks (cookie exists?) — Day 9
→ static shell sent instantly   built at `next build` — Day 3
→ Suspense holes stream in      each one calls the DAL — Days 2–3
    → DAL: cached? reuse it : ask the DB, save it with tags — Day 3
    → DAL: allowed? (requireUser) — Day 9
→ error in a hole?   that hole's error.tsx shows, onRequestError logs it — Days 4, 12
→ browser: client components start, prefetch links in view — Days 1, 11
```

### 3. Cache reads are tagged, and writes throw tags away

```
read:   getPostBySlug('x')  → cacheTag('posts', 'post:x')
write:  likePostAction('x') → updateTag('post:x')   ← must match the READ's tag
```
If a page still shows old data after a write, compare the two tags first.

### 4. Security lives in the DAL, not in the UI or the proxy

The UI hides buttons and the proxy redirects early. Both are only for convenience. The real check is in the DAL (`if (post.authorId !== user.id) return 'forbidden'`), because anyone can send a request directly, without your UI.

### 5. The URL is state

Search (`?q=`), pagination (`?page=`), the modal (`/posts/x` opened from `/search`), and old slugs (308). If something should be shareable, bookmarkable or work with the Back button, put it in the URL, not in `useState`.

---

## Your weak points, and how they changed

### Got better ✅

| Pattern | Early on | Later |
|---|---|---|
| **Skipping the "predict first" and "why" parts** | Day 4: skipped predictions. Days 5–6: asked for the answers, skipped #1c. Day 8: "no idea" on #2. | Day 10: your best homework, with "because…" on almost every answer. Day 12: you linked a test to a Day 4 bug yourself. |
| **Measuring instead of guessing** | Days 2–4: you mostly read the notes. | Day 11: **you** found the CLS bug (0.92) in DevTools, and it was real. Day 10: you checked the build output and corrected my answer key on #1a. |
| **Experimenting on your own** | — | Day 10: the red backdrop. Day 11: the cover-image morph (kept in the app). |

### Still to watch ⚠️

| Pattern | Where it showed up | What to do |
|---|---|---|
| **The right observation, the wrong cause** | Day 7 #1 ("because of the findMany query"; really the shared `posts` tag). Day 9 #2a ("different hashing"; really the in-memory sessions wiped by the restart). Day 12 #3 (blamed Day 4; really your own edit, Expected 200 vs Received 404). | Before explaining, ask: **what did I change, and what does the output literally say?** Read "Expected / Received" and log lines word by word. |
| **The caching model** | Day 3: thought `cacheLife` was a refresh timer, mixed tags with time-based refresh. Day 4: thought `updateTag` makes things cheaper (it deletes entries). Day 7: wrong tag on delete. Day 8: thought ƒ means "hits the DB" (the data can still be cached). | This is the area to review first (Days 3 and 7). Rule: **page cache** (○/ƒ) and **data cache** (`'use cache'`) are separate, and a write must name the reader's tag. |
| **Server vs client placement** | Days 2–4: `ClientComponent` showed `data[0].tags` (the wrong post's tags) three times, until it moved to the server. Day 4: wrapped Suspense around a sync `map` (it must wrap the **async** component). | Default to a Server Component, and pass the data you already have (`post.tags`). Suspense goes around the part that **awaits**. |
| **Leftovers from copying** | Day 6: `color: 'red'` on an element with no text. Day 9: a copied "Dashboard" title on Settings. Day 10: a `<Link>` inside a `<button>`. Day 11: `loading="eager"` left on the thumbnails. | After copying a file, read it top to bottom once: titles, comments, props you don't need. |
| **Answering only half a question** | Day 6 #4 (no "why"). Day 9 #4 (skipped "why hiding the button isn't enough"). Day 12 #4 (no "what would happen"). | Questions with two parts ("why… and what would happen?") need two sentences. |
| **Small JavaScript details** | Day 7: `=> { db.query() }` with no `return`, so the `await` didn't wait. | `=> value` returns. `=> { value }` does **not**, it needs `return`. |

Every mistake in these tables is explained in full, with a real-project example, in [homework-mistakes-review.md](./homework-mistakes-review.md).

### What to review first (in order)

1. **Day 3 + Day 7: caching and tags.** This is the topic with the most mistakes, and the one every real Next.js app depends on.
2. **Day 9: auth in the DAL.** That's where security bugs come from in real projects.
3. **Day 4: status codes vs streaming.** It matters for SEO on any page that can 404.

You said you prefer to keep going and relearn while building something real, and that's a fine way to do it. Use this list when something in your project behaves strangely.

---

## ✅ First real project checklist

Copy this into your new project and tick items as you go. The day in brackets is where DevNotes shows the working version.

### Start

- [ ] `create-next-app` with TypeScript, the App Router and Tailwind. Turn on `typedRoutes` and `cacheComponents` in `next.config.ts`. (Days 1, 3)
- [ ] `.env.example` in git, `.env.local` not in git, and one checked `env` object (zod + `server-only`). (Day 12)
- [ ] Read `node_modules/next/dist/docs/` for any API you're unsure about. Next 16 changes fast.

### Data

- [ ] A real database (Postgres + Prisma or Drizzle), used **only** from `src/data/` (the DAL). (Day 2)
- [ ] The DAL returns DTOs, never raw rows. Every DAL file starts with `import 'server-only'`. (Day 2)
- [ ] Independent reads run in parallel (`Promise.all`, or separate Suspense parts). (Day 2)

### Caching and rendering

- [ ] Public reads: `'use cache'` + `cacheLife` + `cacheTag` (a broad tag + a precise tag). (Day 3)
- [ ] Per-user or per-request reads (`cookies`, `searchParams`) go **inside `<Suspense>`**. (Days 3, 9, 10)
- [ ] Run `npm run build` often and check the table: is each page ○ / ◐ / ● / ƒ, as you expected? (Day 3)

### Writes

- [ ] Forms: a Server Action + `useActionState` + zod. Return the typed values so the form can refill. (Day 7)
- [ ] After each write: `updateTag` with the **same tag the reader used**. (Day 7)
- [ ] `useOptimistic` only where waiting feels slow (likes, deletes). (Day 7)
- [ ] Every action checks the user again in the DAL, even if the button is hidden. (Day 9)

### Auth

- [ ] Use a library (Auth.js, Better Auth, Clerk) rather than your own hashing. Keep the same shape: an httpOnly cookie + `requireUser()` in the DAL. (Day 9)
- [ ] `proxy.ts` only for quick redirects. Never as the only check. (Day 9)

### Errors and status codes

- [ ] `error.tsx` + `not-found.tsx` at the root, and in sections that need their own look. (Day 4)
- [ ] Missing items → `notFound()`. Renamed items → `permanentRedirect()`. Check the real status with `curl -I` on the **first** visit. (Day 4)
- [ ] `onRequestError` sends errors to Sentry (or similar). (Day 12)

### SEO (for public pages)

- [ ] `metadataBase`, a title template, a description and a canonical on every page. (Day 5)
- [ ] One shared `baseOpenGraph`, spread into every page's `openGraph`. (Days 5, 6)
- [ ] `robots.ts`, `sitemap.ts` (from the DAL), `opengraph-image.tsx` with `generateStaticParams`. (Day 6)
- [ ] JSON-LD for the main content type (article, product…). (Day 6)
- [ ] `noindex` on search results and private pages. (Day 10)

### Performance

- [ ] `next/image` with the right `sizes`. The biggest image above the fold gets `fetchPriority="high"`. (Day 11)
- [ ] `next/font`. Third-party scripts through `next/script` with `lazyOnload` when possible. (Day 11)
- [ ] Skeletons the **same size** as the real content. Check CLS in DevTools → Performance. (Day 11)

### Before launch

- [ ] Security headers in `next.config.ts`, and `poweredByHeader: false`. (Day 12)
- [ ] `/api/health` with `await connection()`. (Day 12)
- [ ] Unit tests for rules (validation, URL parsing, permissions). E2E tests for the 3–5 most important user flows. Both run on CI (GitHub Actions). (Day 12)
- [ ] Env vars set in the host's dashboard. No `NEXT_PUBLIC_` on secrets. (Day 12)
- [ ] Run the docs' production checklist: `guides/production-checklist.md`. (Day 12)

---

## 🔧 When something behaves strangely

| Symptom | First thing to check |
|---|---|
| Old data after a write | Does the `updateTag` tag match the reader's `cacheTag`? (Day 7) |
| A page is ƒ, but you expected ○ | What does it read per request (`cookies`, `searchParams`, `request.url`, `connection`)? Move it into Suspense, or into its own route. (Days 3, 8) |
| The build fails: "data outside Suspense" | Something awaits request data outside `<Suspense>`. Wrap that component. (Days 3, 9, 10) |
| A missing page returns 200 | Is the page streaming before `notFound()`? Try `ensureStatic = 'navigation'`. (Day 4) |
| The share card has no picture | Does the page's `openGraph` spread `baseOpenGraph`? (Day 6) |
| The layout jumps while loading | Skeleton size, and whether a scrollbar appears. (Day 11) |
| A test fails | Read **Expected** (what you wrote) vs **Received** (what really happened). Then ask what you changed. (Day 12) |
| Not sure what's happening at all | Watch the terminal (`[db]` lines, errors), run `curl -I` for the status and headers, and check the build table. |

---

## Where everything is

- Lesson notes: `lessons/day-01-foundations.md` … `lessons/day-12-production.md`. Each one ends with its homework review.
- Code: search for `// 📘` to find every teaching comment, and `Day N` to find one day's.
- Branches: `day-01-foundations` … `day-12-production`. Each one is built on the previous day. `git diff day-09-auth-proxy day-10-advanced-routing` shows exactly what one day added.
