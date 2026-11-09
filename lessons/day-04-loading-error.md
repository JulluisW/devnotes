# Day 4: Loading & Error UX

**Goal:** make every way a page can fail end in the right UI **and** the right HTTP status code. A missing post should be a real `404`, a renamed post should be a `308`, and a broken widget shouldn't take the whole page down with it.

Branch: `day-04-loading-error` (from `day-03-caching`).

---

## 1. Where we started: your 404s were 200s

Measured on the Day 3 code with `npm run build && npx next start -p 3005` and `curl`:

| URL | 1st visit | 2nd visit | What it is |
|---|---|---|---|
| `/posts/why-server-components` | 200 · 10 ms | 200 | real post |
| `/posts/does-not-exist` | **200** · 465 ms + `noindex` | 404 · 3 ms | missing post |
| `/posts/data-access-layer` | **200** · 440 ms + `noindex` | 404 | draft (must look missing) |
| `/authors/nobody` | **200** · 635 ms + `noindex` | 404 | missing author |
| `/tags/nope` | **200** · 637 ms + `noindex` | 404 | missing tag |
| `/totally/unknown` | 404 · 9 ms | 404 | matches no route at all |

The UI was right (the 404 page showed), but the **status code was wrong on the first visit** to every missing post, author and tag. A browser doesn't care, but Google, link checkers, monitoring and CDNs read the status code, not your `<h1>`. A 200 response with error content is called a **soft 404**.

Only `/totally/unknown` was a real 404 from the start. To explain why, you need to know when the status code gets sent.

## 2. Two kinds of "it didn't work"

| | **Expected**: the request is fine, the answer is "no" | **Unexpected**: something broke |
|---|---|---|
| Examples | post doesn't exist, post was renamed, not logged in, not allowed | DB timeout, third-party API 503, a bug (`undefined.split`) |
| How you handle it | call a function: `notFound()`, `permanentRedirect()`, `redirect()`, `forbidden()`, `unauthorized()` | `throw` (or just let it throw) |
| Who catches it | Next.js itself | the nearest **error boundary** (`error.tsx`, `catchError`, `global-error.tsx`) |
| What the user gets | `not-found.tsx` UI, or a redirect | error UI with a **Try again** button |
| Status code | 404 / 308 / 307 / 403 / 401 (*if sent in time*, see §4) | 500 (*if sent in time*), otherwise 200 |

> `notFound()` and `redirect()` work by **throwing** a special error. That's why TypeScript knows code after them never runs (`never` type), and why you must **not** call them inside a `try/catch` (homework #3).

Expected errors in **forms** (validation) are different again: you *return* them as values, not throw. That's Day 7 (`useActionState`).

## 3. The special files and where they sit

For one route segment, Next.js nests the special files like this:

```
<Layout>                       layout.tsx      ← NOT covered by this segment's error.tsx
  <ErrorBoundary>              error.tsx       catches throws from everything below
    <Suspense>                 loading.tsx     shows while anything below is loading
      <NotFoundBoundary>       not-found.tsx   catches notFound()
        <Page />               page.tsx
```

Nested segments go *inside* their parent's `<Page />` slot. For a DevNotes post:

```
RootLayout (header, footer)
└ app/error.tsx
  └ PostsLayout (sidebar, Scratchpad)
    └ app/posts/error.tsx
      └ app/posts/[slug]/not-found.tsx
        └ PostPage
```

| File | What it is | Server or Client | Catches |
|---|---|---|---|
| `loading.tsx` | `<Suspense>` around the page | Server (default) | "not ready yet" |
| `not-found.tsx` | boundary for `notFound()` | Server (can be `async`) | `notFound()` in its segment. The **root** one also handles URLs that match no route. |
| `error.tsx` | React error boundary | **Client** (`'use client'` required) | any throw below it, but **not** its own segment's `layout.tsx` |
| `global-error.tsx` | replaces the **root layout** | **Client**, renders its own `<html>` + `<body>` | throws in the root layout itself |

## 4. The HTTP contract: the status code is sent with the first byte

An HTTP response is: **status line → headers → body**. Once the first byte of the body goes out, the status is fixed. Streaming means "send the first bytes early", so:

- `notFound()` / `redirect()` **before** the first byte → real `404` / `307` / `308`
- **after** the first byte → too late. Next.js renders the not-found UI into the stream and adds `<meta name="robots" content="noindex">`. A late `redirect()` becomes a client-side redirect. The status stays `200`.

What sends the first byte? **A Suspense fallback being sent**: a `loading.tsx`, or any `<Suspense>` whose child is still waiting. With Partial Prefetching, that includes the **App Shell** for a param that wasn't in `generateStaticParams`.

### Timeline: `/posts/does-not-exist`, Day 3 code

| t | Server | Visitor / crawler gets |
|---|---|---|
| 0 ms | unknown slug → serve the App Shell for `/posts/[slug]` right away | **`200 OK`** + header, sidebar, `<PostSkeleton>` |
| ~400 ms | `getPostBySlug` returns `null` → `notFound()` | not-found UI + `noindex`, streamed into the same response. Status is still 200. |
| after | renders the URL in the background with the slug known, gets a 404, caches it | — |
| 2nd visit | serve the cached 404 | **`404`** in 3 ms, no DB query |

So it "fixes itself" after one visit. But the first visitor (often a crawler following a dead link) gets the soft 404, and every made-up URL creates a cache entry.

### The fix: `export const ensureStatic = 'navigation'` (new in 16.4)

```ts
// src/app/posts/[slug]/page.tsx
export const ensureStatic = 'navigation';
```

It means: **this route must be 100% static output** (prerendered or `'use cache'`d, no request-time data anywhere, layouts included). Two effects:

1. **For a slug that wasn't prerendered, Next.js waits for the complete page** before sending anything, instead of streaming the App Shell first. So `notFound()` and `permanentRedirect()` run before the first byte.
2. **The build checks it.** If someone later adds an uncached query, `cookies()`, or a `'seconds'` cache to this page, `next build` fails instead of quietly making the page dynamic.

### Timeline: `/posts/does-not-exist`, Day 4 code

| t | Server | Visitor / crawler gets |
|---|---|---|
| 0 ms | unknown slug → render the complete page first, send nothing yet | (waiting) |
| ~400 ms | `getPostBySlug` → `null` | (waiting) |
| ~700 ms | `getRenamedPostSlug` → `null` → `notFound()` → render `posts/[slug]/not-found.tsx` | (waiting) |
| ~800 ms | complete page ready, status known | **`404`** + the post-specific 404 page |
| 2nd visit | serve the cached 404 | `404` in 2 ms |

**The trade-off:** the first visitor to an *unlisted* slug waits ~0.8 s for the page instead of seeing the shell immediately. Listed slugs are prerendered, so they're unaffected (still 200 in a few ms). For a blog, where Google is a main visitor, a correct status is worth that.

Other ways to get the check before the first byte:
- do the existence check **outside every `<Suspense>`** (works, but then that route has no App Shell at all)
- check in **`proxy.ts`** before rendering starts (Day 9)

### Measured after Day 4

| URL | 1st visit | 2nd visit |
|---|---|---|
| `/posts/why-server-components` | 200 · 8 ms | 200 · 4 ms |
| `/posts/does-not-exist` | **404** · 805 ms | 404 · 2 ms |
| `/posts/data-access-layer` (draft) | **404** · 751 ms | 404 · 2 ms |
| `/posts/server-components-101` (old slug) | **308 → `/posts/why-server-components`** · 749 ms | 308 · 2 ms |
| `/authors/nobody` | 200 + `noindex` | 404 |
| `/tags/nope` | 200 + `noindex` | 404 |

Authors and tags are still soft 404s on the first visit. That's homework #1.

## 5. Redirects: which one?

| | Status | Use when | SEO effect |
|---|---|---|---|
| `redirect('/x')` | **307** temporary | "go here for now": after login (Day 9), after a form submit (Day 7, uses 303) | Google keeps the **old** URL indexed |
| `permanentRedirect('/x')` | **308** permanent | the content **moved for good**: a renamed slug | Google moves ranking and links to the **new** URL |
| `redirects()` in `next.config.ts` | 307 / 308 | a fixed list you know at build time | same, and it runs before any rendering |

DevNotes renamed `server-components-101` to `why-server-components`. The old slug lives in the DB (`previousSlugs`), so the redirect is **data-driven**:

```ts
const post = await getPostBySlug(slug);
if (!post) {
  const currentSlug = await getRenamedPostSlug(slug); // cached, tagged 'posts'
  if (currentSlug) permanentRedirect(`/posts/${currentSlug}`);
  notFound();
}
```

If you only have a handful of fixed renames, `next.config.ts` `redirects()` is simpler. Use the in-page version when the history lives in your data.

## 6. Error boundaries: choose how much of the page to lose

When something throws, React replaces **the whole subtree under the nearest error boundary** with the error UI. So *where* the boundary sits decides what the user loses. We tested each case in the browser with the failure switches in `src/lib/chaos.ts`:

| Failure | Caught by | Replaced | Still on screen |
|---|---|---|---|
| analytics API (`chaos.analytics = 1`) | `<WidgetBoundary>` (`catchError`) | only the "readers now" badge | hero, latest posts, trending |
| post query (`chaos.postBySlug = 1`) | `app/posts/error.tsx` | post body | header, **sidebar, Scratchpad text** |
| same, *without* `posts/error.tsx` | `app/error.tsx` | everything under the root layout, sidebar included | header, footer |
| root layout (`<SiteHeader>` throws) | `app/global-error.tsx` | the entire document (**status 500**) | nothing from your layout |

Rule of thumb: **put an error boundary around anything that can fail on its own**. It usually goes right next to a `<Suspense>`: Suspense handles "not ready yet", the error boundary handles "failed".

```tsx
<WidgetBoundary name="Live stats">
  <Suspense fallback={<LiveStatsFallback />}>
    <LiveStatsBadge />
  </Suspense>
</WidgetBoundary>
```

### `catchError` (stable since 16.3)

`error.tsx` only works per route segment. For a boundary around one component, use `catchError` from `next/error` instead of writing a React class component:

```tsx
'use client';
import { catchError, type ErrorInfo } from 'next/error';

function WidgetFallback({ name }: { name: string }, { retry }: ErrorInfo) {
  return <p>{name} unavailable. <button onClick={() => retry()}>Retry</button></p>;
}
export const WidgetBoundary = catchError(WidgetFallback); // props: { name, children }
```

It knows about Next.js: it lets `notFound()` / `redirect()` pass through instead of treating them as crashes, `retry()` re-fetches from the server, and the error clears when you navigate away.

### `retry()` vs `reset()`

| | Does | Can fix a Server Component error? |
|---|---|---|
| `retry()` | asks the **server** to render the segment again, swaps it in if it works | ✅ |
| `reset()` | clears the error state and re-renders **in the browser** only | ❌ the server output is still the failed one |

Use `retry()`. (`reset()` was the only option before 16.2.)

### Why error boundaries must be Client Components

When a Server Component throws inside `<Suspense>`, the HTML already contains the fallback. You saw this in the browser console:

> The server could not finish this Suspense boundary … Switched to client rendering.

The browser then renders that part itself, hits the error, and the **client-side** error boundary shows the error UI. Error boundaries run in the browser, so they need `'use client'`.

### What the error UI receives

- `error` is typed `unknown`: a Client Component can throw anything. Narrow it with `instanceof Error`.
- **In production, errors from Server Components arrive with a generic message.** DB details, file paths and secrets never reach the browser. You get `error.digest`, a hash that also appears next to the real error in the server logs. `ErrorPanel` shows it as "Reference: …".
- In dev you see the real message (and the dev overlay).

### Errors and the cache

- **A thrown error is not stored by `'use cache'`.** Measured: with `chaos.analytics = 1`, every Retry click made a new `[analytics] → readersNow()` call.
- In production, a **cached page keeps serving its last good version** if the background refresh fails, and Next.js tries again on the next request (ISR behavior, from the docs). So a DB outage after the build doesn't break `○` pages. It only breaks request-time work, like the `live` hole.

## 7. `loading.tsx` vs `<Suspense>`

`loading.tsx` is a `<Suspense>` boundary that Next.js puts around `page.tsx` for you. `/tags/[tag]` now uses one, so the page itself can be `async` and `await params` at the top, with no inner component:

```tsx
// tags/[tag]/loading.tsx → <Suspense fallback={<TagLoading />}>
export default async function TagPage({ params }: PageProps<'/tags/[tag]'>) {
  const { tag } = await params; // inside loading.tsx's boundary, so the App Shell still works
  …
}
```

| | `loading.tsx` | `<Suspense>` |
|---|---|---|
| Covers | the whole page area of the segment | exactly what you wrap |
| Good for | pages where **nothing** is useful without data | pages with static parts (the post page streams its author card later) |
| Setup | drop in a file | wrap components yourself |

With Cache Components, prefer granular `<Suspense>`. A `loading.tsx` turns the whole page area into a skeleton. And remember §4: **a loading fallback that gets sent starts the stream**, so a `notFound()` below it can only produce a soft 404.

## 8. Try it yourself (the failure switches)

**What `chaos.ts` is:** a list of fake failure rates. Our fake DB (`db.ts`) and fake analytics API (`analytics.ts`) read it before they answer. `0` means answer normally. `1` means throw an error every time. `0.5` means throw on about half the calls. It's only a practice tool, so you can see the error UI without waiting for a real outage. Real apps don't have this file.

With `postBySlug: 1`, a post request goes:

| Step | What happens |
|---|---|
| 1 | the page calls `getPostBySlug(slug)` |
| 2 | `db.posts.findBySlug` waits 400 ms like a real DB |
| 3 | it checks `chaos.postBySlug`, which is `1`, so it throws `DB query failed …` instead of returning the post |
| 4 | the error travels up to the nearest error boundary: `app/posts/error.tsx` |

The build runs the same code to prerender the posts, so `npm run build` fails while any switch is above 0.

`src/lib/chaos.ts`:

```ts
export const chaos = {
  analytics: 0,   // "readers now" badge on /
  postBySlug: 0,  // body of every post page
};
```

With `next dev` running, set one to `1`, save, reload, and watch the terminal (`[analytics] ✗ …` / `[db] ✗ …`) and the page. Set `0.5` and click **Retry** a few times. Put everything back to `0` before `npm run build`: an error during prerendering fails the build.

## 9. Other things to know

- **`forbidden()` / `unauthorized()`**: like `notFound()`, but 403 / 401 with `forbidden.tsx` / `unauthorized.tsx`. Day 9 (auth).
- **`global-not-found.tsx`** (experimental): a 404 page for apps with **several root layouts**, where no single `not-found.tsx` can cover every URL. DevNotes has one root layout, so it doesn't need it.
- **`unstable_rethrow(err)`**: put it first in a `catch` block that might catch `notFound()` / `redirect()`. It re-throws Next.js's internal errors and leaves yours to you.
- **`not-found.tsx` output is in the RSC payload of every page in its segment**, prerendered, so the client can show it during navigation. Keep 404 pages light.
- **Status 500** only happens when the error happens before the first byte (we saw it with the root layout). A Server Component error *inside* a `<Suspense>` gets a 200 response with the error UI.

---

## 📝 Homework

1. **Predict, then verify.** Add `export const ensureStatic = 'navigation';` to `src/app/authors/[id]/page.tsx` and `src/app/tags/[tag]/page.tsx`. Before you build, write down:
   a. Will `npm run build` pass? Why or why not?
   b. What status will `/authors/nobody` and `/tags/nope` return on the **first** visit?
   c. `/tags/[tag]` has a `loading.tsx`. Will a visitor to `/tags/nope` see that skeleton first?
   Then check with `npm run build && npx next start -p 3005` and `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3005/tags/nope`.
2. **A useful author 404.** Add `src/app/authors/[id]/not-found.tsx` that says the author doesn't exist and lists the real authors (with links). Which DAL function gives you the list? Does your 404 page need its own `'use cache'`?
3. **Break it.** In `posts/[slug]/page.tsx`, wrap the redirect lookup in a `try/catch`:
   ```ts
   try {
     const currentSlug = await getRenamedPostSlug(slug);
     if (currentSlug) permanentRedirect(`/posts/${currentSlug}`);
   } catch (err) {
     console.error('redirect lookup failed', err);
   }
   ```
   Visit `/posts/server-components-101`. What happens, and what gets logged? Explain why. Then fix it two ways: (a) with `unstable_rethrow`, (b) by moving `permanentRedirect` out of the `try`. Which do you prefer?
4. **Blast radius.** Set `chaos.postBySlug = 1`, type something in the Scratchpad, open a post: note what's still on screen. Now rename `app/posts/error.tsx` to `app/posts/_error.tsx` (the `_` prefix hides it from routing) and try again. What disappeared, and which file caught the error? Rename it back and reset chaos to `0`.
   *Theory:* `<PostLinks>` (the sidebar) lives in `posts/layout.tsx`. If it threw, would `app/posts/error.tsx` catch it? Which file would?
5. **Explain back.** In your own words, with a timeline like the ones in §4: on the Day 3 code, why did `/tags/nope` return 200 on the first visit and 404 on the second?
6. *(Carry-over, still open)* `ClientComponent` on the post page shows `data[0].tags`: the tags of another post. Render `post.tags` on the server instead, and switch to `import type { PostSummary }`.

---

## ✅ Homework review

Reviewed on 2026-11-09. Everything was measured on your code with `npm run build && npx next start -p 3005` and `curl`.

| # | Your answer | Verdict and the key idea |
|---|---|---|
| 1 | "ensureStatic makes the not-found page send 404 instead of 200" | ✅ Measured on your code: `/authors/nobody` **404** (877 ms), `/tags/nope` **404** (630 ms), both on the first visit. You skipped the two predictions. **a.** The build passes, because every query on both pages is `'use cache'`d (`'days'` / `'blog'`). **b.** 404, as you said. **c.** No, the visitor doesn't see `loading.tsx` first: Next.js waits for the complete page before sending a byte, so the fallback is never sent. That's *why* the 404 works. A fallback that went out would have locked the status at 200. |
| 2 | Built `authors/[id]/not-found.tsx` with `getAuthors()`. "Does it need its own `'use cache'`?" → "Yes I guess so" | The page works ✅. But **no, it doesn't need its own `'use cache'`.** `getAuthors()` is already cached in the DAL, so the data is cached. Caching the component too would only store the same output twice. (You didn't add one, which was right.) Small cleanup: the header comment was copied from the post 404 and still talks about `/posts/[slug]`, and the function is still named `PostNotFound`. |
| 2b | "What if someone spams the not-found page? Maybe updateTag helps?" | Good question. Measured below. **`updateTag` doesn't help.** It *deletes* cache entries when your data changes, which means more recomputing, not less. |
| 3 | "Got `redirect lookup failed Error: NEXT_REDIRECT`" | ✅ Right observation, missing the explanation. `permanentRedirect()` doesn't return. It **throws** an `Error` whose message is `NEXT_REDIRECT`, and Next.js catches it higher up to send the 308. Your `catch` caught it first, like any other error, so Next.js never saw it. Execution continued to `notFound()`, and the visitor got a **404 instead of a 308**. Your current code (the try/catch removed) is fix **(b)**, the better one: keep the try around only the code that can really fail, and call `redirect` / `notFound` outside it. Use `unstable_rethrow(err)` only when you can't separate them. |
| 4 | "app/error.tsx catches it, because `_error.tsx` isn't read by Next and it finds the parent's error.tsx" | ✅ Exactly. Small precision: it isn't the `_` that hides it. Next.js only treats the exact name `error.tsx` as special, so *any* other name is just a normal file. Adding `<posts>` / `<layout>` to the titles to see which boundary caught it was a smart debugging move (remove them before committing). You skipped the theory part: **no**, `app/posts/error.tsx` can't catch an error in `posts/layout.tsx`'s `<PostLinks>`. An `error.tsx` sits *inside* its own segment's layout, so the layout is outside its reach. That error goes to `app/error.tsx`, and the sidebar disappears with it. |
| 5 | Shell sent first → 200; after caching, the 2nd visit gets 404 | ✅ Correct. One wording fix: the browser didn't *assume* the content was OK. The **server** had already sent `200` in the first bytes, before it knew the tag was missing, and a status can't be changed once sent. Full timeline below. |
| 6 | Turned `ClientComponent` into an async Server Component that awaits the promise, and wrapped the list in `<Suspense>` | ❌ The bug is still there. It still renders **`data[0].tags`**, which are the tags of the newest post that shares this post's first tag. That's not necessarily this post. See below. |

### #2b: what does spamming 404s cost? (measured)

| Requests | Responses | DB queries |
|---|---|---|
| 5 **different** fake authors (`/authors/bot1` … `bot5`) | 404, ~640 ms each | **15** (3 per URL: `authors.findById`, `posts.findMany`, `authors.findMany`) |
| the **same** fake author 5 more times | 404, ~1.6 ms each | **0** (cached 404) |

- Repeating one URL is nearly free. Each **new** URL costs about 3 queries plus one cache entry. The in-memory cache is capped at 50 MB per server (`cacheMaxMemorySize`), so memory doesn't grow forever, but the DB work is real.
- **Cheaper existence check:** check the id against the already-cached `getAuthors()` list *before* running the per-id queries. That's one cache entry for every visitor, so a fake id costs 0 DB queries.
- **Stop it before rendering:** rate-limit or block bots in `proxy.ts` (Day 9), or at your CDN or firewall.

### #5: timeline for `/tags/nope` (Day 3 code)

| t | Server | Crawler gets |
|---|---|---|
| 0 ms | `nope` isn't in `generateStaticParams` → send the App Shell for `/tags/[tag]` now | **`200 OK`** + header + skeleton. The status is now fixed. |
| ~600 ms | `getPostsByTag('nope')` → `[]` → `notFound()` | 404 UI + `noindex` streamed into the same 200 response |
| right after | renders `/tags/nope` again in the background with the tag known. `notFound()` now happens before any byte, so the stored result is a 404 | — |
| 2nd visit | serve the stored result | **`404`** in ~2 ms, 0 queries |

### #6: why the "Tags" section is still wrong

```ts
const tags = getPostsByTag(post.tags[0]); // all posts that have this post's FIRST tag, newest first
data[0].tags                              // the tags of the NEWEST of those posts
```

On the original data, `/posts/layouts-that-persist` has tags `routing, layouts`. `getPostsByTag('routing')` returns `[file-based-routing (Oct 21), layouts-that-persist (Oct 14)]`, so `data[0].tags` = `routing, fundamentals`. Those are the wrong post's tags.

**Right now the bug is hidden:** you changed `layouts-that-persist` to `status: 'draft'` in `db.ts`. Every remaining published post is now the newest post with its own first tag, so `data[0]` happens to be the same post. (That post now 404s, which is correct for a draft. Revert it to `'published'` if that was only an experiment.)

Moving it to the server was a good instinct, but the problem was never client vs server. **The data you need is already in `post.tags`.** No promise, no extra query, no Suspense:

```tsx
// in PostContent, instead of `const tags = getPostsByTag(...)` + <ClientComponent>
<ul className="flex flex-wrap gap-2 text-sm">
  {post.tags.map((tag) => (
    <li key={tag}>
      <Link href={`/tags/${tag}`} className="text-foreground/70 hover:text-foreground hover:underline">
        #{tag}
      </Link>
    </li>
  ))}
</ul>
```

Then delete `ClientComponent.tsx`. About the inner `<Suspense fallback={'loadignsinds'}>`: it can never show. A fallback only appears while something **inside** the boundary is waiting. The `await promise` happens *above* it, and `.map()` is synchronous. Also, `ClientComponent` is a misleading name for a Server Component.

### Cleanup before committing Day 4 (✅ done in the Day 4 commit)

The #6 fix is also applied: the post's own tags now render as chips under the title, and `ClientComponent.tsx` is deleted. Verified after the cleanup: `/posts/layouts-that-persist` shows `#routing #layouts`. Every missing post, author and tag is a real 404 on the first visit.


- `chaos.postBySlug` is still `1`. **This fails `npm run build`** (measured: `Export encountered an error on /posts/[slug]/page`), and it's probably why your 22:13 build stopped halfway. Set it to 0.
- `layouts-that-persist`: back to `'published'` unless the draft was intentional.
- `PostPage` became `async` but awaits nothing. Remove `async`, which also matches the comment above it.
- `tags/[tag]/page.tsx`: `ensureStatic` sits under the comment that explains `await params`. Give it its own comment.
- Remove the `<posts>` / `<layout>` debug labels from the two `error.tsx` titles.
