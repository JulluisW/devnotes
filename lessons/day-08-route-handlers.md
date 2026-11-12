# Day 8: Route Handlers (endpoints for other programs)

**In one sentence:** pages answer **browsers** with HTML. Route Handlers answer **other programs** (apps, scripts, feed readers, other services) with JSON, XML or anything else.

Branch: `day-08-route-handlers` (from `day-07-mutations`).

> 🔑 **New file: `.env.local`** with `CMS_WEBHOOK_SECRET=devnotes-local-secret`. It's in `.gitignore` (secrets never go into git), so it lives only on your machine. **Restart `npm run dev` / rebuild**, because env files are read when the server starts.

---

## ⭐ Must know (4 things)

| # | What | File | URL |
|---|---|---|---|
| 1 | A JSON API | `app/api/posts/route.ts`, `app/api/posts/[slug]/route.ts` | `/api/posts`, `/api/posts/<slug>` |
| 2 | Is a GET cached? | (same files) | same rules as pages: ○ ● ƒ |
| 3 | RSS feed | `app/feed.xml/route.ts` | `/feed.xml` |
| 4 | A webhook | `app/api/webhooks/cms/route.ts` | `POST /api/webhooks/cms` |

Everything after the "Details" heading is **OK to skip for now**.

---

## 1. `route.ts`: an endpoint, not a page

- **What it does:** a `route.ts` file turns its folder into an HTTP endpoint. You export a function named after the HTTP method. It gets a `Request` and returns a `Response`. There's no React and no layout.
- **You write** (`src/app/api/posts/route.ts`, shortened):
  ```ts
  export async function GET() {
    const posts = await getPublishedPosts(); // the same cached DAL as the pages
    return Response.json({ posts });
  }
  ```
- **Visitors get** (measured):

  | Request | Answer |
  |---|---|
  | `GET /api/posts` | `200`, JSON with the 4 published posts (no draft, no private columns) |
  | `GET /api/posts/file-based-routing` | `200`, one post as JSON (including `likes`) |
  | `GET /api/posts/nope` or the draft | `404 {"error":"Post not found"}` |
  | `POST /api/posts` | `405 Method Not Allowed`, with `Allow: GET, HEAD` (automatic: we only exported GET) |

- **APIs answer with status codes.** A program checks `response.status`, it doesn't read your error text. So "not found" is `Response.json({ error }, { status: 404 })`, not a 200 with an error message.
- **A folder can't have both** `page.tsx` and `route.ts`, because both would answer the same URL. That's why the API lives under `app/api/`.
- **Which tool for which job:**

  | Who needs the data? | Use |
  |---|---|
  | your own page | a **Server Component** calling the DAL (Days 2–3) |
  | your own page, to **change** data | a **Server Action** (Day 7) |
  | **another program**: a mobile app, a partner site, a feed reader, a webhook from another service | a **Route Handler** (today) |

- **⚠️ Avoid:** a page doing `fetch('/api/posts')` to get its own data. It's an extra HTTP request to yourself for data the page can read directly. It also breaks the build, because there's no server to call while building.

## 2. Is a GET cached? Same rules as pages

With Cache Components, a GET handler is treated like a page:
- If it only reads **cached** data, and **doesn't read the request**, it's made at **build time**.
- If it reads the request (`request.url`, headers, cookies) or uncached data, it runs on **every request**.

Measured build table:

```
├ ○ /api/posts                                1h   1w   ← only cached DAL → made at build
├   /api/posts/[slug]
│ ├ ● /api/posts/why-server-components         1h   1w   ← generateStaticParams, like the post page
│ └ ● …
├ ƒ /api/webhooks/cms                                    ← POST: never cached
├ ○ /feed.xml                                 1h   1w
```

| | First request |
|---|---|
| `/api/posts` (○) | **6 ms**, 0 DB queries |
| `/api/posts/<slug>` (●) | **5 ms** |

- **The tags still work.** After a like, `/api/posts/<slug>` showed the new count right away. The like calls `updateTag('post:<slug>')` (Day 7), and that tag is on `getPostBySlug`, which the API uses too. **One tag updates every place that shows the data: pages, API, feed, picture.**
- **Use** `generateStaticParams` in a `[slug]` route handler, the same way as in a page (Day 6, trap 2).

## 3. The RSS feed: XML from a Route Handler

- **What it does:** RSS is an XML list of your latest posts. Feed readers (Feedly, Slack's `/feed`, newsletter tools) check it regularly and show new posts to subscribers.
- **Why a Route Handler?** Next.js has special files for `sitemap.ts` and `robots.ts`, but not for RSS. So `app/feed.xml/route.ts` builds the XML string and returns it. A folder name can contain a dot: the URL is `/feed.xml`.
- **Output** (measured, `curl localhost:3005/feed.xml`):
  ```xml
  <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <channel>
      <title>DevNotes</title>
      <link>http://localhost:3005/</link>
      <item>
        <title>Why Server Components Changed Everything</title>
        <link>http://localhost:3005/posts/why-server-components</link>
        <pubDate>Wed, 28 Oct 2026 00:00:00 GMT</pubDate>
        <dc:creator>Maya Chen</dc:creator>
        <category>react</category>
        …
  ```
- **Two must-dos:**
  - **Escape every value** (`escapeXml`). A title like `Tips & Tricks` would break the XML.
  - **Set the `Content-Type`** to `application/rss+xml`, so readers know it isn't HTML.
- **Tell readers where it is:** `alternates: { canonical: '/', types: rssAlternate }` on `/` and `/posts` outputs
  `<link rel="alternate" type="application/rss+xml" href="http://localhost:3005/feed.xml" title="DevNotes"/>`.
  It's **not** in the layout, because every page sets its own `alternates`, which **replaces** the layout's. That's the Day 5 trap again. Measured: `/about` has no feed link, which is fine.

## 4. A webhook: another service calls you

- **What it is:** the reverse of an API. Instead of you calling a service, the service calls **you** when something happens on its side. Here we pretend DevNotes' posts are edited in a headless CMS (Contentful, Sanity…). When an editor clicks "Publish", the CMS sends:
  ```bash
  curl -X POST localhost:3005/api/webhooks/cms \
    -H 'x-webhook-secret: devnotes-local-secret' \
    -H 'content-type: application/json' \
    -d '{"event":"post.updated","slug":"file-based-routing","title":"Folders Are Your Routes"}'
  ```
- **The handler does 4 things, in order:**
  1. **Check the secret.** The URL is public, so anyone can POST to it. The secret (from `.env.local`) proves it's our CMS.
  2. **Validate the body** with zod.
  3. **Save** the change through the DAL.
  4. **`revalidateTag('posts', 'max')`**
- **Measured answers:**

  | Request | Answer |
  |---|---|
  | no secret / wrong secret | `401 Unauthorized` |
  | not JSON, or a wrong `event` | `400 Invalid payload`, with zod's messages |
  | unknown slug | `404` |
  | correct | `200 {"ok":true,"revalidated":["posts"]}` |

- **Why `revalidateTag(…, 'max')` and not `updateTag`?**
  - `updateTag` **only works in Server Actions**. In a Route Handler it throws.
  - **Nobody is waiting.** On Day 7, the person who clicked ♥ had to see their like. Here the editor is in the CMS, not on your site. Being one visit late is fine.
- **What visitors saw** (measured on a production build, title changed by the webhook):

  | | post page | `/posts` | home | tag page | RSS | JSON API |
  |---|---|---|---|---|---|---|
  | 1st visit after the webhook | old | old | old | old | old | old |
  | 2nd visit (3 s later) | **new** | **new** | **new** | **new** | **new** | **new** |

  That's `'max'` (stale-while-revalidate): the first visitor gets the saved copy instantly and triggers a rebuild in the background. Everyone after them gets the new title. Nobody waits for the database.
- **Why the broad `posts` tag this time?** A **title** is shown almost everywhere: the post page, every list, Trending, the feed, the API, the share picture. All of them carry `posts`. On Day 7, a **like** changed one number shown in two places, so it used two precise tags. **Choose the tag by where the changed data is shown.**

---

## Two traps we hit (both measured)

### Trap 1: an "optional" field wiped the excerpt

The CMS sent only a `title`. zod's `.optional()` still produces `{ title: 'Folders…', excerpt: undefined }`, and `Object.assign(post, data)` copied that `undefined` over the real excerpt. Then the RSS feed crashed while rebuilding (`Cannot read properties of undefined (reading 'replaceAll')`).

What visitors saw: **the old feed, without an error page**. Errors aren't saved in the cache (Day 4), so Next.js kept serving the last good copy. That's good for visitors, but it hid the bug: only the terminal showed it.

**Fix:** `updatePostFromCms` copies only the fields that were actually sent.

### Trap 2: the webhook changed the title, but pages kept the old one

Even 47 seconds after the webhook, the post page still had the old title, while the JSON API had the new one. The terminal showed the page **did** re-run `findBySlug` and still got the old title.

**Why:** Next.js bundles Route Handlers separately from pages, and **each bundle ran its own copy of `db.ts`**, so there were two separate `posts` arrays in memory. The webhook updated one copy, and the pages read the other.

**Fix:** `db.ts` keeps its arrays on `globalThis`, which everything in the server process shares. **This is a fake-DB problem only.** A real database is a separate server that every bundle talks to. (Day 7's actions didn't hit it, because actions run inside the page's bundle.)

> 💡 Same rule as Day 6: **check the terminal, not just the page.** Both traps looked like "caching is slow" in the browser. The terminal showed the real cause.

---

## Details (OK to skip for now)

- **Reading the request makes a GET `ƒ`:** `new URL(request.url).searchParams`, `request.headers`, `cookies()` and `headers()` all mean "this answer depends on who's asking", so it can't be made at build time. See homework #1.
- **`RouteContext<'/api/posts/[slug]'>`:** the generated type for the second argument, like `PageProps` for pages. It appears after `npm run dev` or `npm run build`.
- **`timingSafeEqual`:** compares the secret in constant time, so an attacker can't guess it one letter at a time by measuring response times.
- **Real CMS webhooks** often sign the body (an HMAC signature header) instead of sending the secret itself. The idea is the same: prove the sender.
- **CORS:** a browser on **another website** can't read your API's response unless you add `Access-Control-Allow-Origin`. Programs (curl, servers, mobile apps) aren't affected by CORS.
- **`OPTIONS` and `HEAD`** are added automatically.
- **Rate limiting:** a public endpoint can be spammed. Hosts (Vercel, Cloudflare) offer limits, or you count requests per IP yourself.
- **`revalidateTag(tag, { expire: 0 })`:** "never serve the old copy". The next visitor waits for fresh data. Use it from a Route Handler when being one visit late isn't acceptable.
- **BFF (Backend for Frontend):** using Route Handlers as a thin layer in front of other APIs (hide API keys, reshape responses). Useful when a client-side library like SWR needs an endpoint.

---

## Cheat sheet

| I want… | Write… |
|---|---|
| a JSON endpoint | `app/api/x/route.ts` → `export async function GET() { return Response.json(data) }` |
| a "not found" for programs | `Response.json({ error: '…' }, { status: 404 })` |
| one endpoint per item | `app/api/x/[id]/route.ts` + `ctx: RouteContext<'/api/x/[id]'>` + `generateStaticParams` |
| make it cached | only read cached DAL functions, and don't read the request |
| XML, text, CSV… | `new Response(body, { headers: { 'Content-Type': '…' } })` |
| an RSS feed | `app/feed.xml/route.ts` + `alternates.types` on the home page |
| receive a webhook | `export async function POST(request)` → check secret → zod → DAL → `revalidateTag(tag, 'max')` |
| a secret | `.env.local` (not in git) → `process.env.NAME` |
| my **own page** reads data | ❌ not a Route Handler: call the DAL in a Server Component |
| my **own page** changes data | ❌ not a Route Handler: a Server Action |

---

## 📝 Homework

Short ones. **Write your prediction before you check.**

1. **Filter the API (predict, then build).** Make `GET /api/posts?tag=react` return only posts with that tag. Read the tag with `new URL(request.url).searchParams.get('tag')` and use `getPostsByTag`. Before running `npm run build`, predict: will `/api/posts` still be `○`? Then check.
2. **Break the webhook (curl only).** Send a webhook with a correct secret and slug but **no title and no excerpt**: `-d '{"event":"post.updated","slug":"file-based-routing"}'`.
   a. What status do you get? Did anything change?
   b. That's a bug: the CMS thinks it updated something. Make it a `400`. (Hint: zod's `.refine()` on the object, or an `if` in the handler.)
3. **Theory.** Why doesn't the post page do `await fetch('http://localhost:3005/api/posts/' + slug)` to get its data? Give two reasons.
4. *(Bonus)* Add `Access-Control-Allow-Origin: *` to `/api/posts` (the second argument of `Response.json` takes `headers`). Then run `npm run dev` (port 3000) next to your `next start -p 3005`. Different ports count as **different sites**. Open `localhost:3000` and, in its browser console, run `fetch('http://localhost:3005/api/posts').then(r => r.json())`. Try it with and without the header. What changes? Does `curl` care?

---

## ✅ Homework review

| # | Your answer | Result |
|---|---|---|
| 1 | Still cached (○), "but a different cache" | 🟡 It's **ƒ**. Your "different cache" hunch is the right idea, see below |
| 2 | Didn't know how | Solved below, step by step |
| 3 | Extra request to yourself + no server at build time | ✅ Right. Your follow-up question is answered below |
| 4 | Got the CORS error without the header | ✅ Right. Explained below, plus what `curl` is |

### #1: two different saved things

Measured on a production build with your `?tag=` code:

```
├ ƒ /api/posts        ← was ○ before
```

| Request | Time | DB queries |
|---|---|---|
| `/api/posts` (1st) | 661 ms | 2 |
| `/api/posts` (2nd) | **3 ms** | 0 |
| `/api/posts?tag=react` (1st) | 609 ms | 2 |
| `/api/posts?tag=react` (2nd, 3rd) | **3–6 ms** | 0 |

There are **two different saved things**, and that's what your "different cache" hunch was about:

| Saved thing | Before `?tag=` | After `?tag=` |
|---|---|---|
| ① the **finished response** (the whole JSON) | ✅ made at build time → **○** | ❌ the answer depends on the URL, so it can't be made in advance → **ƒ** |
| ② the **data** (`'use cache'` in the DAL) | ✅ | ✅ still saved, one entry per tag value |

So **ƒ means "the GET function runs on every request"**, not "the database is hit every time". The function runs, but `getPostsByTag('react')` returns its saved copy, which is why it takes 3 ms.

**Rule:** reading the request (`request.url`, headers, cookies) turns off ①, but ② keeps working.

### #2: solved, step by step

**Step 1: see the problem.** With the right secret and slug but no title and no excerpt, the old code answered:
```
{"ok":true,"revalidated":["posts"]} [200]
```
The terminal showed `posts.update("file-based-routing", [])`: an update with **zero fields**. The CMS is told "done", nothing changed, and every `posts` page got expired for nothing.

**Step 2: why zod let it through.** `title` and `excerpt` are both `.optional()`, so `{ slug }` alone is valid **shape-wise**. zod checks each field on its own; it can't tell that "at least one of the two" is required.

**Step 3: the fix.** After zod, one `if` in `app/api/webhooks/cms/route.ts`:
```ts
const { slug, title, excerpt } = parsed.data;

if (title === undefined && excerpt === undefined) {
  return Response.json({ error: 'Send a title, an excerpt, or both' }, { status: 400 });
}
```

**Step 4: check it** (measured):
```
no title, no excerpt → {"error":"Send a title, an excerpt, or both"} [400]   (no DB update)
with a title         → {"ok":true,"revalidated":["posts"]} [200]
```

The pattern for every endpoint: **zod checks the shape of each field, then a plain `if` checks rules that involve several fields together.** (zod's `.refine()` can do the same thing inside the schema, but the `if` is easier to read.)

### #3: a Client Component calling your own API

Your follow-up: *"If a Client Component calls my route, it won't break the build, right?"*

**Right, as long as the `fetch` runs in the browser.** That means inside:
- an event handler (`onClick`)
- `useEffect`
- a data library like SWR or React Query

⚠️ **One catch:** Client Components are **also rendered once on the server** to make the first HTML (that's how your `LikeButton` shows "18 likes" before any JavaScript loads). A `fetch` written **directly in the component body** runs during that server render too, at build time, with no server to call. That breaks the build, just like in a Server Component.

**When a Client Component fetching your own API makes sense:**
- the data must refresh **without a page reload**, like checking every 10 s for new comments ("polling")
- it depends on something only the browser knows, like the visitor's location or what they type in a search box

**When it doesn't:** data the page could get on the server. Fetching it in the browser means a spinner first, an extra request, and the data isn't in the HTML for Google.

### #4: CORS, and what `curl` is

**What you saw:**
```
Access to fetch at 'http://localhost:3005/api/posts' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**What actually happened:**

| Step | What happens |
|---|---|
| 1 | JavaScript on `localhost:3000` asks the browser to fetch `localhost:3005/api/posts` |
| 2 | The browser **sends** the request. Your server answers `200` with the JSON |
| 3 | The browser sees that the page (3000) and the API (3005) are **different sites** (a different port counts) |
| 4 | It looks for `Access-Control-Allow-Origin` in the response. It's missing, so **the browser hides the response from the JavaScript** and shows the CORS error |

So CORS is **a rule the browser enforces**. It protects visitors: a random website can't use your browser to read data from another site you're logged into. Your server still received and answered the request.

With `{ headers: { 'Access-Control-Allow-Origin': '*' } }`, the server says "any website may read this", and the fetch works. That's fine for **public, read-only** data like `/api/posts`. I left it on. Never use `'*'` on endpoints that use cookies or return private data.

**What is `curl`?** A program in your terminal that sends HTTP requests, like `fetch`, but **without a browser**. I used it in every lesson to measure things (status codes, timings, headers). Try it:

```bash
curl http://localhost:3005/api/posts
```
prints the JSON.

```bash
curl -i http://localhost:3005/api/posts
```
`-i` also prints the response **headers** first (measured):
```
HTTP/1.1 200 OK
access-control-allow-origin: *
content-type: application/json
```

**Does `curl` care about CORS?** No. CORS only exists in browsers. curl, servers and mobile apps read the response either way. That's why CORS is **not** security for your API: anyone can still call it with curl. It only stops **other websites' JavaScript running in a visitor's browser**.
