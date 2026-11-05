# Day 1: Foundations

**Goal:** understand how the App Router turns folders into pages, and where your code actually runs (server or browser).

## 1. File-based routing

The `src/app` folder **is** your URL structure:

```
src/app/
├── layout.tsx              → wraps EVERYTHING (root layout, required)
├── page.tsx                → /
├── not-found.tsx           → any 404
├── about/
│   └── page.tsx            → /about
└── posts/
    ├── layout.tsx          → wraps /posts and /posts/*
    ├── page.tsx            → /posts
    └── [slug]/
        └── page.tsx        → /posts/:slug   (dynamic segment)
```

Rules to memorize:

- A **folder** creates a URL segment. It's only *publicly reachable* once it contains a `page.tsx`.
- **Special files** (`page`, `layout`, `not-found`, `loading`, `error`, `route`…) have reserved meanings. Any other file in `app/` (e.g. `utils.ts`) is ignored by the router, so colocating is safe.
- `[slug]` = dynamic segment. `[...slug]` = catch-all. `[[...slug]]` = optional catch-all.
- We keep reusable UI in `src/components` and data logic in `src/lib`. That's a convention, not a rule.

## 2. Layouts vs pages

| | `layout.tsx` | `page.tsx` |
|---|---|---|
| Purpose | Shared UI shell | Unique UI of a route |
| Receives | `children` (+ `params`, slots) | `params`, `searchParams` |
| On navigation | **Stays mounted**. State is preserved | Re-renders |

Layouts **nest**: visiting `/posts/file-based-routing` renders
`RootLayout → PostsLayout → PostPage`.

🔬 **Observe it:** open any post, type in the *Scratchpad* (it lives in `posts/layout.tsx`), then click another post in the sidebar. The text survives. That's **partial rendering**: Next.js only swaps the segment that changed, and the shared layout stays mounted.

Now click ♡ on the LikeButton (it lives in the *page*) and open a **different** post. That post's button starts fresh. Each `[slug]` value is its own segment, so post B is a brand-new component instance with its own `useState`. Then press the browser **Back** button. Post A's like is **still there!**

**Why?** With Cache Components (Next 16), pages you navigate away from are not unmounted. Next.js hides them with React's `<Activity>` (`display: none`) and keeps their state and DOM, for up to **3 routes**. So the full picture is:

| Situation | What happens to client state |
|---|---|
| Shared layout, page changes below it | Layout stays **mounted**, so its state is kept |
| Navigating to a route you haven't visited (recently) | Fresh mount, so state starts from the initial value |
| Coming back to one of the last ~3 routes | **Restored** from Activity, so the state is still there |

> ⚠️ **Correction (after homework review):** an earlier version of these notes said the LikeButton simply "resets" when you switch posts. That was the pre-Next-16 behavior. See the [Preserving UI state guide](https://nextjs.org/docs/app/guides/preserving-ui-state).

## 3. Server Components vs Client Components ⭐ (the most important concept)

In the App Router, **every component is a Server Component by default.**

| Server Component (default) | Client Component (`"use client"`) |
|---|---|
| Runs on the server only | Prerendered on the server, then **hydrated** in the browser |
| Can be `async`, can `await` data directly | Can use `useState`, `useEffect`, event handlers |
| Can access secrets, DB, filesystem | Can use browser APIs (`window`, `localStorage`) |
| **Ships 0 KB of JS** for itself | Its code + imports go into the JS bundle |

The `"use client"` directive marks a **boundary**. The file with it, and everything that file imports, becomes client code.

**Mental model:** Server Components are the skeleton of your page. Client Components are small interactive *islands*. In DevNotes:

- `SiteHeader` → Server (static markup)
- `NavLink` → Client (needs `usePathname()` to highlight the active link)
- `PostPage` → Server (reads data)
- `LikeButton`, `Scratchpad` → Client (need `useState`)

**Rules of the boundary:**
1. A Server Component *can render* a Client Component, and pass it props.
2. Those props must be **serializable** (no functions, no class instances). `initialLikes={post.likes}` is fine.
3. A Client Component **cannot import** a Server Component, but it *can* receive one as `children`. (We'll use this trick later.)
4. Push `"use client"` as far down (to the leaves) as possible.

## 4. `<Link>` and navigation

`<Link>` from `next/link` renders an `<a>` but navigates on the client (no full reload), and **prefetches** routes when links enter the viewport. Use it for all internal links.

## 5. Dynamic routes, `params`, and `generateStaticParams`

```tsx
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}
```

At build time, Next.js calls this and prerenders one HTML page per slug. That's the App Router version of `getStaticPaths`. For SEO, it means crawlers get complete HTML instantly.

`params` is a **Promise** (since Next.js 15). You must `await` it.

### ⚠️ What happened while building today (a Next.js 16 lesson)

The first version awaited `params` at the top of the page:

```tsx
export default async function PostPage({ params }) {
  const { slug } = await params; // ❌ blocks the whole route
```

The dev overlay showed an insight: *"`params` accessed outside of `<Suspense>` may prevent the navigation from being instant."* With **Cache Components** (on by default in new Next 16 apps), Next.js wants every route to have an instant **static shell**. URL data like `params` must be read *inside* a `<Suspense>` boundary, so everything outside it can be prerendered and served immediately.

The fix:

```tsx
export default function PostPage({ params }: PageProps<"/posts/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />  {/* awaits params inside */}
    </Suspense>
  );
}
```

Don't worry about fully understanding this yet. Day 3 is all about it. Just remember: **in Next 16, the dev overlay is your mentor too. Read its insights.**

🔬 **Side-effect to notice:** `curl -I http://localhost:3000/posts/nope` returns **200**, not 404. The page streams `not-found` *after* the response headers were sent, so Next.js adds `<meta name="robots" content="noindex">` instead ("soft 404"). On Day 4 we'll discuss when that's acceptable for SEO and how to get a hard 404.

## 6. TypeScript superpowers we turned on

- **`PageProps<'/posts/[slug]'>` / `LayoutProps<'/posts'>`**: global types generated from your folders. No imports needed. `params` is correctly typed as `Promise<{ slug: string }>`.
- **`typedRoutes: true`** (in `next.config.ts`): `href` is type-checked. `<Link href="/postz">` is a compile error.
- **`notFound()` returns `never`**, so after `if (!post) notFound();` TypeScript knows `post` is defined.

## 7. Reading the build output

```
○ /about                    Static: prerendered HTML
◐ /posts/[slug]             Partial Prerender: static shell + streamed parts
○ /posts/why-server-components   prerendered from generateStaticParams
```

Get in the habit: `npm run build` → read the table → ask "why did Next.js choose that?"

---

## 📝 Homework

1. **New route:** create `/tags/[tag]` that lists all posts with that tag. Use `generateStaticParams` to prerender every tag, and await `params` inside `<Suspense>` like we did for posts. Make the `#tag` pills in `PostCard` link to it.
2. **Boundary check:** add `console.log("rendered!")` to `SiteHeader` and to `NavLink`. Where does each log appear: terminal, browser console, or both? Explain why.
3. **Break it on purpose:** in `PostPage`, try passing a function as a prop to `LikeButton` (e.g. `onLike={() => {}}`). Read the error. Then try `<Link href="/postz">` and run `npx tsc --noEmit`.
4. **Explain back:** in 2–3 sentences, explain to me why the Scratchpad keeps its text but the LikeButton resets.

Bring your answers next session. We'll review them before starting **Day 2: the Data Layer**.
