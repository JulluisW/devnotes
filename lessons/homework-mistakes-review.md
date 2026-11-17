# Homework mistakes review: what went wrong, and what it looks like in a real project

**In one sentence:** this page collects every mistake and weak spot from your 12 homework reviews, explains what was really happening, and shows the same mistake in a realistic project so you can spot it at work.

**How each item is laid out:**
- **You said / did:** your answer or code, from the review
- **What really happens:** the correct mechanism
- **In a real project:** the same mistake outside DevNotes, with code
- **Rule:** one line to remember

The two big sections, **Metadata & SEO** and **Webhooks & route handlers**, come first, as you asked. The quiz at the end checks yourself.

---

## ⭐ Must know: the 6 rules behind most of your mistakes

| # | Rule | Mistakes it explains |
|---|---|---|
| 1 | **A page's `openGraph` (or `alternates`, `robots`…) replaces the layout's whole object.** Spread the shared base. | Day 5 lost og:site_name, Day 6 lost pictures |
| 2 | **A request handler must reject input that changes nothing.** zod checks each field; a plain `if` checks rules across fields. | Day 8 empty webhook = 200 |
| 3 | **ƒ means "the function runs on every request", not "the database is hit".** Page cache and data cache are separate. | Day 8 #1, Day 3 #1 |
| 4 | **`updateTag(x)` must use the same tag as the reader's `cacheTag(x)`.** | Day 7 delete, Day 7 #1 |
| 5 | **When something surprises you, first ask "what did I change?" and read the output word by word.** | Day 7 #1, Day 9 #2a, Day 12 #3 |
| 6 | **Hiding something in the UI is not security.** The check lives in the DAL / route handler. | Day 9 #4, Day 12 #4, Day 8 CORS |

Everything below explains these rules with examples.

---

## Part A: Metadata & SEO (Days 5–6)

### A1. Metadata merges shallowly: the page's object replaces the layout's

**What happened (Day 5 trap, then again Day 6 #3):**
- The root layout set `openGraph: { siteName, locale, images }`.
- The post page set `openGraph: { type: 'article', title }`.
- The post page **lost** `og:site_name`, `og:locale`, and on Day 6, the preview picture.

You answered Day 6 #3 with "only the post pages keep a picture". Half right: `/` also keeps it, because `app/opengraph-image.tsx` sits in the same folder as `app/page.tsx`. A picture file always applies to its own folder's page.

**What really happens:** Next.js merges metadata **one level deep**. Top-level keys (`title`, `description`, `openGraph`) are merged. But if the page sets `openGraph`, the layout's whole `openGraph` object is thrown away. Nothing inside it is merged.

**In a real project** (a shop):
```ts
// app/layout.tsx
export const metadata = {
  openGraph: { siteName: 'Kopi Store', locale: 'id_ID', images: ['/og-default.png'] },
};

// app/products/[id]/page.tsx — ❌ the share card has no site name and no picture
export async function generateMetadata({ params }) {
  const product = await getProduct((await params).id);
  return { openGraph: { title: product.name, type: 'website' } };
}

// ✅ spread the shared base, then override
import { baseOpenGraph } from '@/lib/site';
return { openGraph: { ...baseOpenGraph, title: product.name, images: [product.imageUrl] } };
```
**How you'd notice:** a link pasted in Slack or WhatsApp shows no picture. Check with `curl -s <url> | grep og:` and count the tags.

**Rule:** any page that sets `openGraph` spreads `baseOpenGraph`. The same goes for `robots` and `alternates`.

### A2. `generateMetadata` that returns `{}` gives a 404 page the home title

**What happened (Day 5 #5):** for `/posts/does-not-exist`, the page called `notFound()` (a correct 404 and the "post doesn't exist" body). But `generateMetadata` did `if (!post) return {}`. The 404 page got **the home page's title**.

**What really happens:** two separate pieces of code decide two separate things.

| Code | Decides |
|---|---|
| the page component | status code + body |
| `generateMetadata` | `<title>` and the other `<head>` tags |

Only when **`generateMetadata` itself** calls `notFound()` does Next.js use `not-found.tsx`'s metadata.

**In a real project:**
```ts
// ❌ Google sees "Kopi Store — Home" as the title of every missing product
export async function generateMetadata({ params }) {
  const product = await getProduct((await params).id);
  if (!product) return {};
  return { title: product.name };
}

// ✅ one helper used by BOTH generateMetadata and the page
async function loadProduct(id: string) {
  const product = await getProduct(id);   // cached in the DAL, so calling it twice is free
  if (!product) notFound();
  return product;
}
```
**Rule:** if the page can 404, `generateMetadata` must call `notFound()` too. Put that in a shared `loadX()` helper.

### A3. The title template only applies to `title`

**What happened (Day 5 #3):** with `title: { template: '%s | DevNotes' }` in the layout, and `openGraph.title: post.title` on the page:

| Tag | Value |
|---|---|
| `<title>` | `Why Server Components… \| DevNotes` (template applied) |
| `og:title` | `Why Server Components…` (no template) |
| `twitter:title` | copied from `og:title` |

**In a real project,** this is usually what you **want**: the browser tab shows "Product | Shop", and the share card shows just "Product". But if your marketing team expects the suffix on Slack previews, you have to add it to `openGraph.title` yourself.

**Rule:** `title.template` touches `<title>` only.

### A4. `metadataBase` only affects URLs that must be absolute

**What happened (Day 5 #1):**
- You got #1a right: the canonical became `https://devnotes.dev/posts/…` even on `localhost:3005`, because `SITE_URL` is read at **build time**.
- #1c, the author link, stays relative (`/authors/rafael`).

**What really happens:** `metadataBase` is added only to fields that are read **away from your site**: canonical, `og:url`, `og:image`. Google and Slack need a full URL there. A normal `<link rel="author">` is read while on your site, so a path is enough.

**In a real project:** you deploy to a **preview URL** (`my-app-git-feature.vercel.app`), and every canonical and og:image still points to `https://myapp.com`, because that's what `SITE_URL` was at build time. That's correct for SEO. But if you test share cards on the preview, they show the **production** pictures, not your new ones.

**Rule:** `SITE_URL` must be set **before** `next build`. Changing it later needs a rebuild.

### A5. Request-time work in metadata breaks a fully static route

**What happened (Day 5 #4):** `await connection()` inside `generateMetadata` on a route with `ensureStatic = 'navigation'` made **the build fail**. The suggested fixes were only [cache] or [static], and caching doesn't apply to `connection()`.

**In a real project:**
```ts
// ❌ a product page that must be static, but the metadata reads cookies for "personalised" titles
export async function generateMetadata() {
  const country = (await cookies()).get('country')?.value;   // request-time → build fails
  return { title: `Shipping to ${country}` };
}
```
Metadata is for **Google and share cards**, which have no cookies anyway. Keep it built from the data only.

**Rule:** metadata should depend on the URL's data, never on the visitor.

### A6. Robots: `disallow` hides your `noindex`

**What happened (Day 6 #4):** you picked the right answer (B, `noindex`), but without the reason.

**What really happens:**

| Option | Google… | Result |
|---|---|---|
| A: `disallow` in robots.txt | never opens the page, so it **never sees** a `noindex` inside it | the URL can still show in results (bare, no description) if other sites link to it |
| B: `noindex` meta tag | opens the page, reads "don't list me" | removed from results |

**In a real project:** you want `/checkout` and `/account` out of Google. Many people add both `Disallow: /account` **and** `noindex`. Then the `noindex` is never read. Use only `noindex` (and the login check, of course).

**Rule:** never `disallow` a page you want removed from Google. `disallow` = "save crawl budget", `noindex` = "don't list".

### A7. OG pictures: a style that does nothing, and testing on the wrong server

**What happened (Day 6 #5):**
- You set `color: 'red'` on the dot. The dot has **no text**, so `color` changes nothing. Its color comes from `background`.
- You also didn't know how to see the change. On `next start`, the picture is ● (made at **build time**), so you'd need a rebuild.

**In a real project:**
```tsx
// ❌ no visible change: color only affects text
<div style={{ width: 24, height: 24, borderRadius: 12, color: 'red' }} />
// ✅
<div style={{ width: 24, height: 24, borderRadius: 12, background: 'red' }} />
```
To test: `npm run dev`, open `http://localhost:3000/<page>/opengraph-image` directly, edit, save, refresh. After deploying, use a preview checker like opengraph.xyz.

**Rule:** for anything built at build time (●/○), check it in `next dev`, or rebuild.

### A8. Small things from the Day 6 JSON-LD homework

- **`author?.name` when `author` can't be null** (there's a `notFound()` above it). `?.` would silently print `undefined` if a real bug made it null. Use `?.` only when null is a normal, expected case.
- **`async` + `<Suspense>` around a component that awaits nothing.** Suspense only does something around code that **waits**.
- **The OG image route without `generateStaticParams`** (Day 6 trap): ƒ, 1.3 s and 2 DB queries on the first request. With it: ●, 12 ms. Any `opengraph-image.tsx` in a `[param]` folder needs its own `generateStaticParams`.

---

## Part B: Webhooks & route handlers (Days 8 and 12)

First, a reminder of what DevNotes' webhook does, step by step:

```
CMS: POST /api/webhooks/cms   header x-webhook-secret: …   body {"slug":"…","title":"…"}
  1. secret wrong?            → 401   (timingSafeEqual, so the comparison time doesn't leak hints)
  2. body shape wrong? (zod)  → 400
  3. post doesn't exist?      → 404
  4. update the DB, revalidateTag('posts', 'max') → 200
```

### B1. A webhook that says "OK" but changes nothing

**What happened (Day 8 #2):** you didn't know how to start. With the right secret and slug but **no title and no excerpt**, the endpoint answered:
```
{"ok":true,"revalidated":["posts"]} [200]
terminal: posts.update("file-based-routing", [])   ← an update with ZERO fields
```

**What really happens:** `title` and `excerpt` are both `.optional()`, so `{ slug }` alone has a **valid shape**. zod checks fields one at a time. It can't know "at least one of these two is required". So the CMS was told "done", nothing changed, and every `posts` page was thrown out of the cache for nothing.

**In a real project** (a payment provider tells you about an order):
```ts
const schema = z.object({
  orderId: z.string(),
  status: z.enum(['paid', 'refunded']).optional(),
  trackingNumber: z.string().optional(),
});

const parsed = schema.safeParse(await request.json());
if (!parsed.success) return Response.json({ error: 'Bad payload' }, { status: 400 });

const { orderId, status, trackingNumber } = parsed.data;
// ✅ the rule zod can't express per field:
if (status === undefined && trackingNumber === undefined) {
  return Response.json({ error: 'Nothing to update' }, { status: 400 });
}
```
Why it matters: a 200 tells the sender "delivered, never send this again". If it was really a mistake on their side, a 400 lets them see it in their webhook dashboard.

**Rule:** zod for the shape of each field, then a plain `if` for rules across fields. Never answer 200 for a request that did nothing.

### B2. Optional fields can erase data (my bug, found while building Day 8)

**What happened:** the first version of the DAL did `Object.assign(row, { title, excerpt })`. When the CMS sent only a title, `excerpt` was `undefined`, so `Object.assign` **set the excerpt to `undefined`**. The RSS feed then crashed on that post, and the old feed kept being served.

**In a real project** (a PATCH endpoint for a user profile):
```ts
// body: { "name": "Luis" }   → bio and avatar are undefined
// ❌ wipes bio and avatar
await db.user.update({ where: { id }, data: { name, bio, avatar } });   // some libraries treat undefined as "skip", some as "set null". Know yours.
Object.assign(user, { name, bio, avatar });                             // this one definitely overwrites

// ✅ copy only what was sent
const changes = Object.fromEntries(Object.entries({ name, bio, avatar }).filter(([, v]) => v !== undefined));
```
**Rule:** "the field is missing" and "set the field to empty" are different. Partial updates only copy the fields that were sent.

### B3. Reading the request makes the route ƒ, but the data can still be cached

**What happened (Day 8 #1):** you added `?tag=` filtering with `request.url` and predicted it would stay ○, "but a different cache". The build said **ƒ**. Your "different cache" hunch was the right idea.

**What really happens:**

| Saved thing | Before `?tag=` | After `?tag=` |
|---|---|---|
| ① the finished response (the whole JSON) | ✅ made at build → ○ | ❌ depends on the URL → ƒ |
| ② the data (`'use cache'` in the DAL) | ✅ | ✅ still saved, one entry per tag |

Measured: the first `?tag=react` took 609 ms (DB), and the second took **3 ms** (data cache), even though the route is ƒ.

**In a real project:** a product search API `GET /api/products?category=shoes` is ƒ, and that's fine. Put `'use cache'` on `getProductsByCategory(category)` and repeated categories are fast. Don't panic when you see ƒ: check the DB logs.

**Rule:** ƒ = "the handler runs every time". Whether the DB is hit depends on the DAL's cache.

### B4. `revalidateTag(tag, 'max')` is one visit late, on purpose

**What happened (Day 7 #2, also the Day 8 webhook):** after the update, the **first** visit still showed the old data, and the second showed the new data.

| | `updateTag('x')` | `revalidateTag('x', 'max')` |
|---|---|---|
| where | Server Actions only | anywhere: route handlers, webhooks |
| next visitor | **waits** for fresh data | gets the **old** copy once, while a fresh one is made in the background |
| use for | "I just clicked like, show it to me" | "the CMS changed a post, it's fine if it appears a second later" |

**In a real project:** an editor fixes a typo in the CMS. The webhook calls `revalidateTag('post:slug', 'max')`. The editor opens the page and still sees the typo, files a bug, then refreshes and it's fixed. Tell the editors about this, or show "Changes may take a moment" in the CMS.

**Rule:** a user's own action → `updateTag`. An outside system telling you → `revalidateTag(…, 'max')`.

### B5. Two copies of the "database" (my bug, found while building Day 8)

**What happened:** the webhook updated the post, but pages still showed the old title. Route handlers and pages are bundled separately, and each had **its own copy** of the arrays in `db.ts`. The fix was putting the arrays on `globalThis`.

**In a real project:** this is why you **never keep state in a module variable** on a server:
```ts
// ❌ lib/cart.ts — works in dev, breaks in production
const carts = new Map<string, Item[]>();
```
It can be split across bundles (like ours), lost on every restart or deploy, and different on each server when you have more than one. Use a database, Redis, or a cookie.

**Rule:** server memory is not storage.

### B6. The secret: never `NEXT_PUBLIC_`, and the consequence

**What happened (Day 12 #4):** you gave the right reason (`NEXT_PUBLIC_` values are pasted into the browser JS), but not what would happen.

**What would happen, step by step:**
1. Anyone opens DevTools → Sources and searches the JS for `webhook`.
2. They find the secret.
3. They run this in a loop:
   ```bash
   curl -X POST https://devnotes.dev/api/webhooks/cms -H "x-webhook-secret: <secret>" -d '{"slug":"x","title":"Hacked"}'
   ```
4. They can now **change post titles** and empty your cache whenever they like.

**In a real project:** Stripe secret keys, database URLs and webhook secrets never get `NEXT_PUBLIC_`. If one leaks, **rotate it**: make a new one at the provider and update the host's env vars. Deleting it from git isn't enough, because the history and built JS files keep it.

**Rule:** `NEXT_PUBLIC_` = "I'm OK with this being on a billboard".

### B7. CORS is not security for your API

**What happened (Day 8 #4):** ✅ you saw the CORS error. The lesson behind it:
- The browser **did send** the request, and your server answered 200. The browser only **hid the response** from the other site's JavaScript.
- `curl`, servers and mobile apps ignore CORS completely.

**In a real project:** someone says "our API is safe, CORS only allows our domain". It isn't. Anyone can `curl` it. CORS protects **visitors** (another site can't use their logged-in browser to read your data). It doesn't protect your **API**. Use auth (a session or an API key) for that.

**Rule:** CORS decides which websites' JavaScript may **read** a response. It doesn't block requests.

### B8. Don't fetch your own API from the server (you got this right ✅)

Day 8 #3: a Server Component calling `fetch('/api/posts')` makes an extra HTTP round trip to itself, and **breaks the build**, because there's no server running during `next build`. Call the DAL function directly. Your follow-up was also right: a Client Component may fetch your API in `onClick`, `useEffect` or SWR, but **not in the component body**, because that also runs on the server during the build.

---

## Part C: Caching (Days 3, 4, 7)

### C1. Time vs tags: two different triggers

**You said (Day 3 #1):** *"What's the trigger? I never touched `'posts'`."* The data refreshed anyway.

**What really happens:**

| Trigger | API | Fires when |
|---|---|---|
| **time** | `cacheLife` | automatically, when a request comes in **and** the copy is older than its lifetime |
| **event** | `cacheTag` + `updateTag` / `revalidateTag` | only when **your code** calls it |

Tags do **nothing** by themselves. They're labels waiting for an `updateTag`. And `cacheLife` is not a timer that refreshes on its own: it's a maximum age, **checked when a request comes in**. No visitors means no refresh.

**In a real project:** a "Today's deals" section with `cacheLife('hours')`. At 00:00 the deals change in the DB, but the site shows yesterday's deals until the first visitor after the hour passes, and that visitor still gets the old copy once. If the change must be exact, trigger it: a cron job or the admin's "publish" button calls `revalidateTag('deals')`.

### C2. ◐ comes from a short `expire`, not from mixed lifetimes

**You said (Day 3 #4):** still ◐ "because not all components have the same cacheLife".

**What really happens:** different lifetimes are fine in one static page. The page simply refreshes as often as its shortest piece. ◐ appears because the `live` profile had **expire < 5 minutes**, and anything under that is left out of the build and becomes a dynamic hole. With `expire: 300`, `/` became ○.

**Rule:** a cached piece with an `expire` under 5 minutes becomes a Suspense hole.

### C3. `updateTag` deletes. It doesn't make things cheaper.

**You said (Day 4 #2b):** maybe `updateTag` helps against people spamming fake URLs.

**What really happens:** `updateTag` **throws away** cache entries, so the next request has to recompute: more work, not less. Against spam, check cheap things first (is the id in the already-cached list?), or block bots in `proxy.ts` / at the CDN.

### C4. The delete that used the wrong tag, and the restart that hid it

**What happened (Day 7 #4):**
```ts
// the reader:
async function getComments(slug) { 'use cache'; cacheTag(`comments:${slug}`); … }
// your delete action:
updateTag(`post:${slug}`);   // ❌ the ARTICLE's tag, not the comments'
```
The first delete "worked" because the server had just restarted, so the cache was empty. From the second delete on, the comment stayed on the page even after a reload.

**In a real project:** "it works on my machine, but not in production" is often exactly this. Your dev server restarts all the time, and production doesn't. Test a write **twice in a row** without restarting.

**Rule:** to find the right tag, open the function that **reads** the data you changed, and copy its `cacheTag`.

### C5. A broad tag works, but wastes work

**You said (Day 7 #1):** the post page still updated after `updateTag('posts')` "because of the findMany query".

**What really happens:** it updated because `getPostBySlug` and `getTrendingPosts` **also carry the `posts` tag**. The cost: every list labeled `posts` was thrown away too, so `/posts` re-ran `posts.findMany` **and** `authors.findMany` for a like count it doesn't even show.

**Rule:** use the broad tag for "everything changed" (an import, a deploy), and the precise tag (`post:<slug>`) for one item.

---

## Part D: Server vs client, Suspense and errors (Days 2–4)

### D1. Use the data you already have: the `data[0].tags` bug (3 times)

**What happened (Days 2, 3, 4):** to show a post's tags, `ClientComponent` fetched **all posts with this post's first tag**, then showed `data[0].tags`, which are the tags of the **newest** of those posts. On `/posts/layouts-that-persist` it showed `routing, fundamentals` instead of `routing, layouts`. On Day 4 you moved it to the server, but kept `data[0].tags`, so the bug stayed.

**The fix was simple:** `post.tags` was already loaded on the server.

**In a real project:**
```tsx
// ❌ product page shows "related" sizes by fetching other products
const similar = await getProductsByCategory(product.category);
<Sizes sizes={similar[0].sizes} />      // another product's sizes!

// ✅
<Sizes sizes={product.sizes} />
```
**Rule:** before fetching, ask "is this already in the object I have?". `[0]` on a list is a warning sign.

### D2. Suspense goes around the part that waits

**What happened (Day 4 #6):** `<Suspense fallback="loadignsinds">` wrapped a `.map()`, but the `await` happened **above** it. The fallback could never show.

**Rule:** Suspense catches waiting **inside** it. Wrap the async **component**, not its output:
```tsx
// ❌ the page awaits first, then the Suspense has nothing left to wait for
const reviews = await getReviews(id);
<Suspense fallback={<Spinner />}>{reviews.map(…)}</Suspense>

// ✅
<Suspense fallback={<Spinner />}><Reviews id={id} /></Suspense>   // Reviews awaits inside
```

### D3. `try/catch` swallowed the redirect

**What happened (Day 4 #3):** you saw `redirect lookup failed Error: NEXT_REDIRECT`, and the old URL gave **404 instead of 308**.

**What really happens:** `permanentRedirect()`, `redirect()` and `notFound()` don't return. They **throw** a special error that Next.js catches higher up. Your `catch` caught it first, so Next.js never saw it.

**In a real project:**
```ts
// ❌ the login redirect never happens, the user sees "Something went wrong"
try {
  const user = await getUser();
  if (!user) redirect('/login');
  return await loadOrders(user.id);
} catch (e) {
  return { error: 'Something went wrong' };
}

// ✅ try only around what can really fail
const user = await getUser();
if (!user) redirect('/login');
try { return await loadOrders(user.id); } catch { return { error: 'Could not load orders' }; }
```
**Rule:** keep `redirect` / `notFound` **outside** `try`. If you can't, call `unstable_rethrow(e)` first in the `catch`.

### D4. A status code can't change after the first byte

**You said (Day 4 #5):** the browser "assumed" the page was OK.

**What really happens:** the **server** had already sent `200` with the shell, before it knew the tag was missing. Headers go first, and once they're sent, they're final. `ensureStatic = 'navigation'` makes Next.js finish the page before sending anything, so `notFound()` can still set 404.

**In a real project:** a streamed product page for a deleted product returns 200 + "not found" text, which is a **soft 404**. Google keeps the dead URL in results. Check with `curl -I` on the **first** visit (the second can be a cached 404 and fool you).

### D5. `error.tsx` can't catch its own layout's error

**You skipped this (Day 4 #4 theory):** `app/posts/error.tsx` sits **inside** `posts/layout.tsx`. An error thrown by the layout goes up to `app/error.tsx`, and the whole sidebar disappears with it. If a layout part can fail, give it its own boundary (like the widget boundary on `/`).

---

## Part E: Auth (Day 9)

### E1. The right result, the wrong cause: sessions after a restart

**You said (Day 9 #2a):** after a restart you were logged out "because of different hashing / session code".

**What really happens:** the browser **still had the cookie**. But the list of sessions lived in server memory, and the restart wiped it. The cookie pointed to a session that no longer existed, so `requireUser()` sent you to `/login`.

**In a real project:** this is the B5 rule again. Sessions go in the database or Redis, so a deploy doesn't log everyone out.

### E2. Hiding the button isn't the check

**You skipped (Day 9 #4):** why hiding the Delete button isn't enough.

**What really happens:** the button is just a way to send a POST. Anyone can send the same POST with `curl` or DevTools, without the button. Only the DAL check stopped Rafael from deleting Maya's comment:
```ts
if (!user || !post || post.authorId !== user.id) return 'forbidden';
```
**In a real project:** an admin panel that hides "Delete user" for non-admins, but the `/api/users/:id` DELETE handler doesn't check the role. Any logged-in user can delete anyone. This is one of the most common real security bugs (it's called "broken access control").

**Rule:** every write checks "who is this, and are they allowed?" on the server, every time.

### E3. Use the function that matches the page's job

**What happened (Day 9 #3):** the Settings page used `getCurrentUser()`, which returns `null` when logged out, so a logged-out visitor got a broken page instead of a redirect. It also still had the copied "Dashboard" title.

**Rule:** a private page uses `requireUser()` (it redirects). `getCurrentUser()` is for pages that work both ways (the header showing "Log in" or "Hi, Maya").

---

## Part F: Routing, performance and tests (Days 10–12)

### F1. A link inside a button (Day 10 #4)

`<button><Link>Clear</Link></button>` is invalid HTML: two controls nested inside each other, and screen readers announce both. Style the `<Link>` to look like a button instead.

### F2. Soft navigation keeps slots, a refresh shows `default.tsx` (Day 10 #3)

You answered by moving the page back, instead of doing the step the question asked (refresh with Cmd+R). The difference:
- **After a link click,** the slots keep showing what they had.
- **After a refresh,** each slot shows its `default.tsx`, which was `null` here.

In a real project, that's the "my sidebar panel disappears when I refresh the page" bug. Add a real `default.tsx`.

### F3. `loading="eager"` on a list of thumbnails (Day 11 #2)

You couldn't see lazy loading, so you set `loading="eager"` on every thumbnail. To be fair, my question was flawed: Chrome starts loading lazy images when they're within about 1250 px of the screen, and `/posts` has only 4 cards. But eager on a list defeats lazy loading. On a shop with 60 products, eager downloads all 60 images before the page settles.

**Rule:** only the main image at the top of the page is eager + `fetchPriority="high"`. Everything else stays lazy (the default).

### F4. "Server won't start" vs "every request fails" (Day 12 #1)

With a bad secret, the server **did start** ("Ready"), then answered **500 on every request**. In production, that difference matters: a health check that doesn't load the env would still say "ok". That's why the env check runs in `register()` and the error message is so explicit.

### F5. Reading a failing test (Day 12 #3)

You named the right test, but blamed the Day 4 problem. Read the output literally:
```
Expected: 200   ← what the test says (you changed it to 200)
Received: 404   ← what the server really sent (correct)
```
**Rule:** when a test fails, first ask "did I change the test, or the code?" Then decide which side is wrong.

---

## Part G: Habits (these show up across all days)

| Habit | Examples | What to do instead |
|---|---|---|
| **The right observation, the wrong cause** | "because of the findMany query" (Day 7), "different hashing" (Day 9), "the Day 4 shell problem" (Day 12) | Say what you **saw**, then what you **changed**, then the cause. If you're not sure, say "I think", and test it. |
| **Answering half a question** | no "why" (Day 6 #4), no "why hiding isn't enough" (Day 9 #4), no "what would happen" (Day 12 #4) | Count the question marks. Two questions need two answers. |
| **Skipping predictions** | Day 4 #1, Day 6 #1c | Write your guess **before** running anything. A wrong guess is how you find the gap in your model. |
| **Leftovers from copying** | the "Dashboard" title on Settings (Day 9), `PostNotFound` in the author 404 (Day 4), debug labels in error titles (Day 4) | After copying a file: read it top to bottom, and rename every name and title. |
| **Arrow functions with `{}` and no `return`** | `delete: (id) => { query(…) }` (Day 7): the `await` didn't wait | `=> value` returns it. `=> { value }` returns `undefined`. |
| **Experiments left in** | `chaos.postBySlug = 1` broke the build (Day 4), a post set to `draft` hid a bug (Day 4) | Before committing, `git diff` and undo the experiments. |

---

## 📝 Self-quiz

Answer without looking, then open the answers.

1. Your product page sets `openGraph: { title: product.name }`. What happens to the layout's `og:image`?
2. `generateMetadata` returns `{}` for a missing product. What title does the 404 page get?
3. Your webhook receives `{ "orderId": "42" }` and nothing else. All other fields are optional in zod. What should it answer?
4. A route handler reads `request.url`, and the build shows ƒ. Is the database hit on every request?
5. Which one: an editor publishes in the CMS → webhook. `updateTag` or `revalidateTag(…, 'max')`?
6. Why is `const sessions = new Map()` at the top of a server file a bug?
7. You delete a comment, and it's still on the page after a reload. What's the first thing to check?
8. Your API only allows your domain in CORS. Is it protected?
9. `try { if (!user) redirect('/login') } catch { … }`. What goes wrong?
10. A test says `Expected: 404, Received: 200`. You didn't touch the test. Which side is wrong?

<details>
<summary>Answers</summary>

1. It's **gone**. The page's `openGraph` replaces the layout's whole object. Spread `baseOpenGraph`. (A1)
2. The **layout's default title** (the home title). `generateMetadata` must call `notFound()`. (A2)
3. **400** ("Nothing to update"). zod passes it, so a plain `if` must reject it. (B1)
4. **Not necessarily.** ƒ means the handler runs every time. The DAL's `'use cache'` can still answer in 3 ms. (B3)
5. **`revalidateTag(tag, 'max')`.** `updateTag` only works in Server Actions. (B4)
6. Server memory is lost on restart, separate per bundle, and different per server. Use a DB or Redis. (B5, E1)
7. Does the `updateTag` tag match the `cacheTag` of the function that **reads** the comments? (C4)
8. **No.** curl and servers ignore CORS. Use auth. (B7)
9. `redirect()` throws, and the `catch` swallows it, so there's no redirect. Move it outside the `try`. (D3)
10. **The code (or the server).** The test still says what should happen. Example: the soft-404 bug from Day 4 came back. (F5, D4)

</details>
