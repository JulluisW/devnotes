# Day 2: The Data Layer

**Goal:** fetch real (async) data the App Router way: directly in Server Components, safely behind a Data Access Layer, without waterfalls or duplicate queries.

---

## 🔁 Warm-up: how `<Activity>` works (from Day 1)

Last time you saw a like survive the Back button. Here's the mechanism.

**Before Next 16 (and without Cache Components):** navigating away from a page **unmounted** it. React threw away its component tree, its state and its DOM. Coming back meant a fresh mount.

**Next 16 with Cache Components:** the router wraps each route in React's `<Activity>` component. When you leave a route, Next.js flips it to `mode="hidden"` instead of unmounting it:

```tsx
// conceptually, what the router does for you:
<Activity mode={isCurrentRoute ? 'visible' : 'hidden'}>
  <PostPage />
</Activity>
```

A hidden Activity:
- keeps the **DOM** in the document with `display: none` (scroll positions, input text, open `<details>`, video time all survive)
- keeps **React state** (`useState`, `useReducer`)
- **runs Effect cleanups** (`useEffect` / `useLayoutEffect` return functions), so timers and subscriptions stop while hidden, and the Effects run again when it becomes visible
- renders at low priority, so hidden pages never slow down the visible one

Next.js keeps **up to 3 routes** this way. Older ones are evicted and mount fresh next time.

| You navigate… | What happens |
|---|---|
| Between pages under a shared layout | The layout never changes; only the page segment swaps |
| To a route not in the last ~3 | Fresh mount: state starts from initial values |
| Back to one of the last ~3 routes | Activity flips back to `visible`, so state and DOM are **restored** |

### When preserved state is a bug
Preserving is usually great (form drafts, filters, scroll). But for **transient** UI, like an open dropdown, a toast or a "just submitted!" message, coming back to it is weird. Two fixes:

```tsx
// 1. Reset when hidden: cleanups run when Activity hides the component
useLayoutEffect(() => {
  return () => setIsOpen(false);
}, []);

// 2. Reset a whole subtree on every push/replace (but keep it for Back/Forward)
const { bfcacheId } = useRouter();
return <Fragment key={bfcacheId}>{children}</Fragment>;
```

> 💡 **Interview-level takeaway:** "Navigation in Next 16 behaves like the browser's back/forward cache, but for React state." Docs: [Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state).

---

## 1. Async Server Components

A Server Component can simply be an `async function` and `await` data:

```tsx
async function LatestPosts() {
  const posts = await getPublishedPosts(); // DB query, right here
  return <ul>{/* … */}</ul>;
}
```

No `useEffect`, no loading state management, no `/api` route, no client fetching library. The query runs on the server, and only the resulting HTML/RSC payload goes to the browser.

**`fetch()` vs a DB client:** both work. `fetch()` gets two things automatically: request **memoization** (identical calls in one render are deduped) and integration with Next's caching (Day 3). A DB/ORM call gets neither unless you add them yourself (see `React.cache` below).

> ⚠️ Changed in Next 15+: `fetch()` is **not cached by default** anymore. Caching is opt-in with `'use cache'` (Day 3).

## 2. What changed in DevNotes

```
src/
├── lib/db.ts          🔒 fake DB: async, has latency, has PRIVATE columns
├── data/              🔒 Data Access Layer (DAL): the ONLY code allowed to import db
│   ├── posts.ts          getPublishedPosts, getPostBySlug, getPostsByTag, getAllTags…
│   └── authors.ts        getAuthors, getAuthor
├── lib/format.ts      formatDate (pure, usable anywhere)
└── app/authors/       NEW: /authors and /authors/[id]
```

Open your terminal while browsing: every query prints `[db] → start` and `[db] ← end (Xms)`.

> 🧐 **Dimmed `[db]` lines?** In dev, Next.js renders each route an extra time to **validate the static shell** (that's how it produces those "instant navigation" insights). The dim lines come from that validation pass. Read the bright ones.

## 3. The Data Access Layer (DAL) + DTOs 🔒

The DB rows contain things the public must never see: author `email`, post `internalNotes`, and `draft` posts. The DAL is the single gate between the DB and your UI:

```ts
import 'server-only';                       // build fails if a Client Component imports this

export const getPostBySlug = cache(async (slug: string): Promise<PostDetail | null> => {
  const post = await db.posts.findBySlug(slug);
  if (!post || post.status !== 'published') return null;  // authorization lives HERE
  return { slug: post.slug, title: post.title, /* …only safe fields */ };  // a DTO
});
```

Why this matters:
- **Props become public.** Anything a Server Component passes to a Client Component is serialized into the page. If you pass a whole DB row, the email goes with it, even if you never render it.
- **One place to audit.** Security review = read `src/data/`. Pages can't accidentally skip the "only published" rule.
- **TypeScript enforces the contract.** `type Author = Pick<AuthorRow, 'id' | 'name' | …>` has no `email`, so `author.email` in a page is a compile error.

🔬 **Verified:** `/posts/data-access-layer` (a draft) returns *Page not found*, and no page's HTML contains `devnotes.internal`.

## 4. Sequential vs parallel fetching (waterfalls) 🌊

**Sequential** = request B starts only after request A finishes.

```ts
// ❌ Accidental waterfall: ~500ms + ~600ms = ~1.1s
const author = await getAuthor(id);
const posts = await getPostsByAuthor(id);   // didn't need `author` at all!

// ✅ Parallel: ~max(500ms, 600ms) = ~0.6s
const [author, posts] = await Promise.all([getAuthor(id), getPostsByAuthor(id)]);
```

Rule: **if request B doesn't use the result of request A, they shouldn't wait for each other.** See it in the terminal on `/authors/maya`: both `→` lines print before either `←`.

Sometimes the dependency is real: the post page can't fetch the author until it knows `post.authorId`. Then **don't block the whole page on it**. Give the dependent part its own `<Suspense>`:

```tsx
<article>…post content renders immediately…</article>
<Suspense fallback={<AuthorCardSkeleton />}>
  <AuthorCard authorId={post.authorId} />   {/* streams in ~500ms later */}
</Suspense>
```

Also free: **sibling async components render in parallel.** `/authors` renders three `<AuthorCard>`s, and their three `findById` queries start together.

## 5. `React.cache`: one query per request

The post page calls `getPostBySlug(slug)` in two places: `<PostContent>` and `<RelatedPosts>`. On Day 5, `generateMetadata` will call it too. With `cache()`:

```ts
export const getPostBySlug = cache(async (slug: string) => { … });
```

…all those calls share **one** query per request. Watch the terminal on a post page: one `posts.findBySlug`.

This lets you **fetch where you need the data** instead of fetching at the top and prop-drilling everything down.

Two key facts:
- The scope is **one request**. `React.cache` is not a cross-request cache. Request #2 queries again. (Cross-request caching = `'use cache'`, Day 3.)
- It compares **arguments** by identity: `getPostBySlug('a')` and `getPostBySlug('a')` match, but two different object literals `{ slug: 'a' }` don't. Prefer primitive args.

## 6. Streaming with `<Suspense>`

Every data read now sits inside a `<Suspense>` boundary with a skeleton fallback:

- `/` → hero is instant, `<LatestPosts>` streams
- `/posts` layout → layout + Scratchpad instant, the sidebar list streams
- `/posts/[slug]` → article streams, then the author card streams separately

The server sends the HTML **in chunks over one response**: first the shell + fallbacks, then each boundary's content as soon as it's ready, which React swaps into place. (Crawlers like Googlebot are special-cased: Next.js waits and sends them the complete HTML. More on Day 6.)

### 👀 Look at the build table now

```
Day 1:  ○ /posts                 Day 2:  ◐ /posts
        ○ /posts/file-based-…            ◐ /posts/file-based-…
```

Everything went from **○ Static** to **◐ Partial Prerender**. Our data is now "uncached async I/O", so Next.js can only prerender the shell + skeletons and must query the DB on **every request**. That's correct but wasteful for blog posts that rarely change. **Fixing this is exactly Day 3** (`'use cache'`, `cacheLife`, `cacheTag`).

## 7. Small TypeScript wins today

- `import type { PostSummary } from '@/data/posts'` inside `PostCard`: type-only imports are erased at compile time, so a component can use the DAL's *types* without importing its server-only *code*.
- `Omit<…>`, `Pick<…>` derive DTO types from row types, so they can't drift apart.
- `PostDetail | null` return types force every caller to handle "not found".
- 🧯 You may hit *"Type '/authors/[id]' does not satisfy the constraint 'AppRoutes'"* after adding a route. The generated route types are stale. Run `npm run dev`, `npm run build`, or `npx next typegen` to regenerate them.

---

## 📝 Homework

1. **Find the duplicate query 🔎.** Open `/posts/why-server-components` and read the *bright* `[db]` lines. `posts.findMany({"status":"published"})` runs **twice** in one request, even though we use `React.cache`. Which two components cause it, and why doesn't `cache()` help? Fix it in `src/data/posts.ts`, and confirm in the terminal that it runs once.
2. **Make a waterfall on purpose.** In `authors/[id]/page.tsx`, replace `Promise.all` with two sequential `await`s. Compare the timing in the terminal (`GET /authors/maya … in Xms`), then revert.
3. **Try to leak data.** Create a Client Component (`'use client'`) that imports `getAuthors` from `@/data/authors`. Run `npm run build` and read the error. Explain in one sentence what `server-only` protects you from.
4. **Promise → Client Component (stretch).** In `posts/[slug]/page.tsx`, call `getPostsByTag(...)` **without** `await` and pass the *promise* as a prop to a new `'use client'` component that reads it with React's `use()` hook (wrap it in `<Suspense>`). This is how you stream server data into interactive components.
5. **Explain back:** what's the difference between `React.cache` (today) and the "cache" in `'use cache'` that we'll meet tomorrow? Guess. It's fine to be wrong.
