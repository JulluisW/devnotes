# Day 10: Advanced routing (groups, slots, modals and search)

**In one sentence:** DevNotes gets a **Search** page with pagination (the search lives in the URL), a **preview modal** that opens when you click a search result, and a **dashboard split into independent parts** that load and fail on their own.

Branch: `day-10-advanced-routing` (from `day-09-auth-proxy`).

> 🔁 **To see it on your server:** stop it (`Ctrl + C`), then run `npm run build` and `npx next start -p 3005`.
> Restarting logs you out (Day 9), so log in again as `maya@devnotes.internal` / `devnotes-demo` for the dashboard.

---

## ⭐ Must know (4 things)

| # | What | Folder looks like | One-line job |
|---|---|---|---|
| 1 | Route group | `(overview)/` | organize folders, or give **some** pages a layout, **without changing the URL** |
| 2 | Parallel routes (slots) | `@stats/`, `@comments/` | **several pages at once** in one layout, each with its own loading and error |
| 3 | Intercepting route | `(..)posts/[slug]/` | a link click shows the page **in a modal**; refresh shows the real page |
| 4 | `searchParams` | `/search?q=routing&page=2` | keep search, filters and page numbers **in the URL** |

**One rule ties all four together:** folder names with `( )` or `@` are **never part of the URL**. Only normal folder names are.

```
src/app/dashboard/(overview)/@stats/page.tsx   →  URL: /dashboard
src/app/search/@modal/default.tsx              →  URL: /search
```

Everything after the "Details" heading is **OK to skip for now**.

What's new in the app:
- `/search`: search box, results, ← Previous / Next → (and a **Search** link in the header)
- click a result on `/search` → a preview modal opens
- `/dashboard`: same content as Day 9, now built from 3 parts, plus a new row of numbers (Published, Drafts, Likes, Comments) and a **Settings** link

---

## 1. Route groups: `(folder)`

**What it does:** a folder in parentheses is **only for you**. Next.js skips it when building the URL.

**Example** (today's code):
```
src/app/dashboard/
├─ (overview)/
│  ├─ layout.tsx      ← this layout only wraps the pages inside (overview)
│  └─ page.tsx        → /dashboard
└─ settings/
   └─ page.tsx        → /dashboard/settings  (outside the group: no slots)
```

**Why we needed it:** the dashboard layout shows the numbers and the comments. Settings shouldn't show those. A layout wraps **every** page below its folder, so without the group, it would also wrap `/dashboard/settings`. The group puts the layout "next to" settings instead of "above" it.

**Use it when:**
- some pages need a layout that others in the same URL area shouldn't get (today's case)
- you want to sort folders by team or area (`(marketing)`, `(shop)`) without adding words to the URL

**Avoid:** two groups that make the same URL (`(a)/about` and `(b)/about`). That's a build error.

**Measured:** moving `dashboard/page.tsx` into `(overview)/` changed nothing for visitors. The URL is still `/dashboard`, and `proxy.ts` (matcher `/dashboard/:path*`) didn't need a change.

## 2. Parallel routes: `@slot`

**What it does:** a folder that starts with `@` is a **slot**. Its `page.tsx` is passed to the parent layout as a **prop with the same name**. So one layout can show several pages at the same time.

```tsx
// dashboard/(overview)/layout.tsx
export default function Layout({ children, stats, comments }: LayoutProps<'/dashboard'>) {
  return (
    <div className="space-y-8">
      {children}   {/* (overview)/page.tsx           */}
      {stats}      {/* (overview)/@stats/page.tsx    */}
      {comments}   {/* (overview)/@comments/page.tsx */}
    </div>
  );
}
```

**Why bother?** Each slot is a real page, so each one can have its **own `loading.tsx` and `error.tsx`**:

| Slot | loading.tsx | error.tsx | If it fails… |
|---|---|---|---|
| `@stats` | 4 grey boxes | "Your numbers couldn't be loaded. Try again" | only the numbers row is replaced |
| `@comments` | 2 grey cards | none | goes up to `app/error.tsx` (the whole page) |

**Measured** with `chaos.dashboardStats = 1` (in `src/lib/chaos.ts`): the numbers row showed the red error box. "Your posts" and "Comments on your posts" rendered normally.

**Measured, one DB pass:** all 3 parts call `getMyDashboard()`. It's wrapped in `React.cache` (Day 2), so on one page load the terminal shows `posts.findMany({"authorId":"maya"})` **once**, not 3 times.

**`default.tsx` is required.** Next.js 16 **fails the build** if a slot has no `default.tsx`. It's what the slot shows when it has no page for the current URL after a full page load. Ours return `null`.

**Use it when:** one screen has independent parts (dashboards, a feed + sidebar), or for modals (next section).
**Avoid:** slots just to split a big file. A normal component does that.

## 3. Intercepting routes: the modal

**What it does:** a folder named `(..)posts/[slug]` says: "when someone **clicks** a link to `/posts/<slug>` **from here**, show this file instead of the real post page."

```
src/app/search/
├─ layout.tsx                      ← renders {children} and {modal}
├─ page.tsx                        ← the search results
└─ @modal/
   ├─ default.tsx                  ← no modal: returns null
   └─ (..)posts/[slug]/page.tsx    ← the preview, inside <Modal>
```

`(.)` = same level, `(..)` = one level up, `(...)` = from the app root. **Levels are URL parts**, so `@modal` doesn't count: from `/search`, one level up is the root, then `posts/[slug]`.

**What happens (all measured):**

| You do… | Address bar | You see |
|---|---|---|
| click a result on `/search?q=routing` | `/posts/layouts-that-persist` | the preview **on top of** the results (the results stay mounted, the tab title becomes the post's) |
| ✕, `Esc`, click outside, or Back | `/search?q=routing` | the results, exactly as you left them |
| Forward | `/posts/layouts-that-persist` | the preview again |
| **refresh** while the preview is open | `/posts/layouts-that-persist` | the **real post page** (comments, like button) |
| click a post on `/posts` or `/` | `/posts/…` | the real post page, **no modal** |

The modal only happens for **link clicks that start on `/search`**. A refresh, a shared link or a new tab is a full page load, and a full page load never intercepts.

**Closing = going back.** `components/modal.tsx` calls `router.back()` for ✕, `Esc` and a click outside. Going back makes the URL `/search?…` again, and the `@modal` slot shows its `default.tsx` (nothing).

**"Read the full post →" is a plain `<a>`, not `<Link>`.** Measured with a `<Link>`: the click was intercepted **again**, so the modal just stayed open. A plain `<a>` does a full page load, so you land on the real post page.

**Use it when:** "peek without losing my place": photo galleries, previews, a login box over the current page, a cart drawer.
**Avoid:** when the modal content isn't a real page. A plain `useState` modal is simpler.

## 4. `searchParams`: search and pagination in the URL

**What it does:** the page gets the `?q=…&page=…` part of the URL as a prop.

```tsx
export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  // searchParams is a Promise: { q?: string | string[]; page?: string | string[] }
}
```

**Why the URL and not `useState`?** Because then the search can be shared and bookmarked, and **Back/Forward** step through your searches and pages. Measured: search "Rafael", then Back → page 2 of "all posts" again, search box cleared.

**Three rules from today's code:**

1. **Await it inside `<Suspense>`.** `searchParams` is different for every visitor, so (like cookies on Day 9) the part that reads it streams in. Pass the Promise down and await it in a child:
   ```tsx
   <h1>Search</h1>                                  {/* instant (static shell) */}
   <Suspense fallback={<PostListSkeleton />}>
     <Results searchParams={searchParams} />        {/* awaits inside */}
   </Suspense>
   ```
   Build table: `◐ /search`.

2. **Clean it before using it.** Anyone can type anything in a URL. `parseSearchParams()` in `app/search/search-params.ts` turns raw values into safe ones:

   | URL | Raw value | Clean value |
   |---|---|---|
   | `?page=abc` | `'abc'` | page `1` |
   | `?page=-3` | `'-3'` | page `1` |
   | `?q=a&q=b` | `['a', 'b']` (an array!) | q `'a'` |
   | `?q=  Routing ` | `'  Routing '` | q `'routing'` |
   | `?q=routing&page=99` | | the DAL shows the last page (2) |

   **Measured bonus:** `'use cache'` saves one result per set of arguments. `?page=abc` cleans to the same `(q '', page 1)` as `/search`, so it reused that saved result: **12 ms** instead of ≈620 ms.

3. **Forms and links just change the URL.**
   - The search box is `<Form action="/search">` from `next/form`. Submitting goes to `/search?q=<input>` **without a full reload**, and it sends only its own inputs, so `?page=` is dropped. **A new search always starts on page 1.**
   - Previous / Next are plain `<Link>`s to `searchHref(q, page ± 1)`.

**Use it for:** search, filters, sorting, pagination, tabs: anything a visitor might want to share or come back to.
**Avoid:** private or temporary UI state (an open menu, a half-typed comment). That's `useState`.

---

## Details (OK to skip for now)

- **Soft vs hard navigation decides what a slot shows.** A link click (soft) keeps whatever the slot showed before if the new URL has no page for it. A full page load (hard) uses `default.tsx`. That's why we kept `settings` **out** of the `(overview)` group (see homework #3).
- **The build failed without `generateStaticParams` on the modal.** The modal is its own route, so it doesn't share the post page's list of slugs (the same trap as the OG image on Day 6). With no slugs at all, the header's `<NavLink>` (it uses `usePathname()`) has no URL at build time, and Next.js stops the build. With the list, one preview per post is made at build time (`○ /search/(..)posts/why-server-components`).
- **The modal page is typed as the route it intercepts:** `PageProps<'/posts/[slug]'>`. `'/search/(..)posts/[slug]'` isn't a valid route type.
- **The `<dialog>` trap (measured, fixed).** Next.js 16 keeps the page you left mounted but hidden, so Back/Forward are instant. Our first modal opened the dialog only once. After Back then Forward, the preview came back as a plain box at the bottom of the page, with no dimmed background. Fix: the effect's cleanup closes the dialog when the route is hidden, and the effect opens it again when the route is shown (`components/modal.tsx`).
- **Where interception applies:** Next.js checks where the click **started**: `/search` or any URL below it. A `@modal` slot in `app/posts/` would also intercept clicks **on post pages** (sidebar, related posts), and one in the root `app/` would intercept from **every** page. That's why the modal lives under `/search`.
- **`key={q}` on the search input:** `defaultValue` is only read when React creates the input. After Back, the URL's `q` changes, and the new `key` makes React create a fresh input with the right value.
- **SEO:** `/search` has `robots: noindex, follow`. Every `?q=` is a different URL with near-duplicate content, which you don't want in Google. "follow" still lets Google reach the posts through the links.
- **Prefetching search results:** links prefetch the static shell by default. `<Link prefetch={true}>` would also prefetch the cached results for that `?q=&page=`, at the cost of one server request per link.

---

## Cheat sheet

| I want… | Write… | URL |
|---|---|---|
| a folder that's not in the URL | `app/(name)/…` | unchanged |
| a layout for **some** pages only | put those pages + `layout.tsx` in a `(group)` | unchanged |
| several pages in one layout | `@name/page.tsx` → `layout({ children, name })` | unchanged |
| a slot's own loading / error | `@name/loading.tsx`, `@name/error.tsx` | |
| what a slot shows "otherwise" | `@name/default.tsx` (**required** in Next.js 16) | |
| a modal for a link click | `@modal/(..)target/page.tsx` + `@modal/default.tsx` returning `null` | the target's URL |
| close the modal | `router.back()` | goes back |
| read `?q=` | `const { q } = await searchParams` **inside `<Suspense>`** | |
| a search form | `<Form action="/search"><input name="q" /></Form>` | `/search?q=…` |
| a page link | `<Link href={searchHref(q, page + 1)}>` | `/search?q=…&page=2` |
| ❌ trust the URL | always clean `searchParams` first (`parseSearchParams`) | |
| ❌ a `<Link>` to the full page from inside the modal | use a plain `<a>` | |

---

## 📝 Homework

**For every answer, write one sentence starting with "because…".** Predict before you check. Rebuild first (see the top of this file).

1. **Search URLs (predict, then check).** Open each URL on `localhost:3005` and write what you see:
   a. `/search?q=routing&page=99`: which page number does the pager show?
   b. `/search?q=TYPESCRIPT`: how many results, and what's in the search box?
   c. Click **Next →** on `/search`, then type `rafael` and press Enter. What's the URL? Is there a `page=` in it? Because…?
2. **The modal.**
   a. On `/search`, click a result. What's in the address bar? Now press `Cmd + R`. What do you see, and **because** what?
   b. Go to `/posts` and click the same post. Modal or full page? Because…? (Hint: which folder is `@modal` in?)
3. **Why the route group? (small experiment)** Move the settings folder **into** the group, rebuild, and test. Copy-paste these from the `devnotes` folder:
   ```bash
   mv "src/app/dashboard/settings" "src/app/dashboard/(overview)/settings"
   ```
   ```bash
   npm run build && npx next start -p 3005
   ```
   Log in, open `/dashboard`, then click **Settings**. Write what you see under the Settings heading. Now press `Cmd + R`. What changed? Because…? Then move it back:
   ```bash
   mv "src/app/dashboard/(overview)/settings" "src/app/dashboard/settings"
   ```
   *Bonus:* set `dashboardStats: 1` in `src/lib/chaos.ts`, rebuild, and open `/dashboard`. Which parts still work, and which file caught the error? Set it back to `0`.
4. **A "Clear" link (small coding task).** In `src/app/search/page.tsx`, inside `SearchBox`, add a link next to the Search button that goes back to `/search`. Show it **only when there's a search** (`q` isn't empty). Steps:
   - `SearchBox` already has `q`. Use `{q && ( … )}` to show something only when `q` isn't empty.
   - Inside, a `<Link href={searchHref('')}>Clear</Link>`. (`Link` and `searchHref` are already imported in that file.)
   - Check: `/search` has no Clear link; `/search?q=routing` has one, and clicking it shows all posts with an empty box.

---

## ✅ Homework review

You wrote a "because…" for almost every answer. That's the habit from your homework summary, and it shows: this is your most complete homework so far.

| # | Your answer | Result |
|---|---|---|
| 1a | no pager, because `q=routing` has only 1 page (`pageCount <= 1 → return null`) | ✅ **Better than my answer key.** I had written "Page 2 of 2", but "routing" matches only 2 posts = 1 page, so the pager is hidden. The page number is still cleaned (99 → 1), you just can't see it |
| 1b | 1 result, box shows `typescript`, because `parseSearchParams` lowercases `q` | ✅ |
| 1c | `/search?q=rafael`, page dropped, because `<Form>` only sends its own inputs | ✅ (small slip: it was `page=2` from clicking Next, not `page=99`) |
| 2a | the full post page after a refresh, because only client-side clicks from `/search` are intercepted | ✅ |
| 2b | full page, no modal | ✅. The exact reason: `@modal` lives in `app/search/`, so it only intercepts clicks that **start** on `/search` |
| 3 | after the link click, the stats and comments still show under Settings | ✅ |
| 3 (refresh) | answered "when I move it back" instead of "when I press Cmd+R" | 🟡 see below |
| 3 bonus | only the stats break, everything else is fine | ✅ (the file that caught it: `@stats/error.tsx`) |
| 4 | the Clear link works and only shows when there's a search | ✅ works. One HTML fix, see below |

### #3: what the refresh shows

The experiment had **two** steps with settings **inside** `(overview)`:

| Step | Kind of navigation | Under the Settings heading | Because |
|---|---|---|---|
| click **Settings** on `/dashboard` | soft (a link click) | stats + comments **still there** | a link click keeps whatever a slot showed before, if the new URL has no page for that slot |
| press `Cmd + R` | hard (full page load) | **gone** | after a full load, Next.js doesn't know the old state, so each slot shows its `default.tsx`, which returns `null` |

So the same URL looked **different** depending on how you got there. That's the bug the `(overview)` route group prevents: with settings outside the group, the slots' layout never wraps Settings at all.

### #4: no `<Link>` inside a `<button>`

```tsx
// ❌ before: two clickable things nested in each other
<button type="button"><Link href={searchHref('')}>Back to /search</Link></button>

// ✅ after: one link, styled like a button
<Link href={searchHref('')} className="shrink-0 rounded-md border …">Back to /search</Link>
```

Buttons and links can't be nested (invalid HTML). Screen readers announce two controls in one, and the click can trigger both. **Rule of thumb:** it goes to another URL → `<Link>`. It does something on this page → `<button>`.
