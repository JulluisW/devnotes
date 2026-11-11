# Day 5: Page metadata (SEO I)

**In one sentence:** metadata is the information *about* a page (its title, a short summary, its official address, its link-preview card). Day 5 gives every DevNotes page its own.

Branch: `day-05-metadata` (from `day-04-loading-error`).

---

## 1. What is metadata?

Every HTML page has two parts:

```html
<html>
  <head>   ← NOT shown on the page. Programs read it.
    <title>Layouts That Persist | DevNotes</title>
    <meta name="description" content="Layouts keep their state when you navigate.">
  </head>
  <body>   ← what visitors see
    <h1>Layouts That Persist</h1>
    …
  </body>
</html>
```

Three kinds of programs read the `<head>`:

| Program | What it shows from the `<head>` |
|---|---|
| The browser | the text in the tab |
| Google | the blue link and the grey text under it in search results |
| Slack, WhatsApp, LinkedIn, X, Discord… | the preview card when someone pastes your link |

In Next.js you don't write `<head>` by hand. You export an object from `page.tsx` or `layout.tsx`, and Next.js writes the tags for you:

```ts
export const metadata = { title: 'About', description: 'Why DevNotes exists.' };
```

becomes

```html
<title>About | DevNotes</title>
<meta name="description" content="Why DevNotes exists.">
```

## 2. The problem before Day 5

Only the root layout had metadata, and every page used it. So every page had the same title and summary. Three different pages in Google:

```
DevNotes
localhost:3000 › posts › why-server-components
A developer blog for learning Next.js, one day at a time.

DevNotes
localhost:3000 › authors › maya
A developer blog for learning Next.js, one day at a time.

DevNotes
localhost:3000 › tags › react
A developer blog for learning Next.js, one day at a time.
```

You can't tell which one is the article. A post link pasted in Slack also showed only "DevNotes".

The same post after Day 5:

```
Why Server Components Changed Everything | DevNotes
devnotes.dev › posts › why-server-components
Server Components let you fetch data and render UI on the server,
shipping zero JavaScript for them to the browser.
```

(Google can still rewrite what it shows, but it starts from your tags.)

## 3. The tags, one by one

For each tag: what it does, a DevNotes example, and when to use it or not.

### `<title>`

- **What it does:** names the page. It shows in the browser tab, as the blue link in Google, and in bookmarks.
- **Example:** `Why Server Components Changed Everything | DevNotes`
- **Use it:** on every page, with a different title on every page.
- **Avoid:** the same title on many pages, because Google can't tell them apart. Also avoid very long titles: Google cuts them off after about 60 characters.

### `description`

- **What it does:** a one- or two-sentence summary. Google often shows it under the blue link. Preview cards show it under the title.
- **Example:** the post's excerpt, "Server Components let you fetch data and render UI on the server…"
- **Use it:** on every page you want people to find. For posts, the excerpt you already have is perfect.
- **Avoid:** the same text on every page, or more than about 155 characters (it gets cut off).

### Canonical URL: `<link rel="canonical">`

- **What it does:** says "this is the official address of this page".
- **Why you need it:** the same page can be reached at many addresses, because people add tracking parameters to links:
  ```
  devnotes.dev/posts
  devnotes.dev/posts?utm_source=newsletter
  devnotes.dev/posts?ref=twitter
  ```
  All three show the same content. Without a canonical, Google may treat them as 3 separate pages with copied content and split the ranking between them. With a canonical, all three say "the official one is `devnotes.dev/posts`", so Google counts them as one page.
- **Measured:** `/posts?utm_source=newsletter&ref=x` outputs `<link rel="canonical" href="http://localhost:3000/posts">`.
- **Use it:** on every public page, pointing to that page's own clean address.
- **Avoid:** putting it in the **root layout**. Every page inherits the layout's metadata, so a page that forgot its own canonical would claim "my official address is the home page". Google could then drop that page from its results.

### Open Graph (`og:*` tags)

- **What it does:** fills the link-preview card in Slack, WhatsApp, LinkedIn, Facebook, Discord and iMessage. (Facebook created the Open Graph standard. Almost every app uses it now.)
- **Example:** the preview of a DevNotes post:
  ```
  ▎DevNotes                                              ← og:site_name
  ▎Why Server Components Changed Everything | DevNotes   ← og:title
  ▎Server Components let you fetch data and render UI…   ← og:description
  ▎(picture, added on Day 6)                             ← og:image
  ```
  Other fields we set:
  - `og:url`: the official address (same as the canonical)
  - `og:type`: `article` for posts (this also adds the date, author and tags), `profile` for authors, `website` for everything else
  - `og:locale`: the language
- **Why it matters:** these apps don't run your JavaScript. They download your HTML once and read these tags. Good tags make people click.
- **Use it:** on every page people might share.
- **Watch out for:** the "replace" trap in §6.

### Twitter / X (`twitter:*` tags)

- **What it does:** the same job as Open Graph, but for X.
- **What you write:** nothing. When a page has Open Graph tags, Next.js copies the title, description and image into the `twitter:*` tags for you (measured).
- **Avoid:** writing `twitter: { card: 'summary' }` by hand. Next.js picks the card size itself: a small card without an image, a large card with one (Day 6). A hand-written value would stop it from switching.

### Theme color (the `viewport` export)

- **What it does:** colors the browser's address bar on phones.
- **Example:** `#ffffff` in light mode and `#0a0a0a` in dark mode. Those are the page backgrounds, so the bar blends into the page.
- **Where:** in a separate export called `viewport`, not inside `metadata`. Next.js keeps it separate because the browser needs it before it draws the first pixel.
- **Use it:** it's optional, but it looks nicer on mobile.

### `robots` (noindex)

- **What it does:** `<meta name="robots" content="noindex">` asks Google not to list the page in search results.
- **Automatic:** Next.js adds it to every 404 page.
- **Use it:** on pages that exist but shouldn't be in Google, like very thin pages (homework #2), internal search results, and preview pages.
- **Avoid:** it on real content. A `noindex` page disappears from Google.

## 4. How to write metadata in Next.js

There are two ways. To pick one, ask: **does the text come from the database or the URL?**

### A. Fixed text: `export const metadata`

```ts
// src/app/about/page.tsx
export const metadata: Metadata = {
  title: 'About',
  description: 'Why DevNotes exists and how the course is organized: one Next.js feature per day.',
  alternates: { canonical: '/about' },
  openGraph: { ...baseOpenGraph, type: 'website', url: '/about' },
};
```

- **Use it when:** the text is the same for everyone and doesn't come from the database. In DevNotes: `/`, `/posts`, `/authors`, `/about`, and the 404 pages.
- **Can't use it when:** the route has a `[param]`. You can't know a post's title while you're writing the file.

### B. Text from data: `export async function generateMetadata()`

```ts
// src/app/posts/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps<'/posts/[slug]'>): Promise<Metadata> {
  const { slug } = await params;     // 1. which post?
  const post = await loadPost(slug); // 2. load it (404 or redirect if it's missing, see §7)
  const url = `/posts/${post.slug}`;

  return {                           // 3. build the tags from the data
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { ...baseOpenGraph, type: 'article', url, publishedTime: post.publishedAt },
  };
}
```

- It receives the same `params` as the page.
- **Use it when:** the route has a `[param]`, or the text comes from the database. In DevNotes: posts, authors, tags.
- **Don't use it when:** a fixed object would work. It's more code for nothing.
- A file can export `metadata` **or** `generateMetadata`, not both.

### Layout or page: where does each field go?

Next.js reads the root layout first, then the page. The page's values win.

| Root layout: shared by every page | Each page: unique to that page |
|---|---|
| `metadataBase` (the site's address) | `title` |
| title template and default title | `description` |
| default description | `alternates.canonical` |
| shared Open Graph fields (site name, language) | `openGraph.url`, `openGraph.type` |
| `viewport` (theme color) | |

### The title template

```ts
// src/app/layout.tsx
title: {
  template: '%s | DevNotes',                        // %s is replaced by the page's own title
  default: 'DevNotes: learn Next.js by building it', // used when a page has no title
},
```

| The page writes | The browser tab shows |
|---|---|
| `title: 'About'` | About \| DevNotes |
| `title: post.title` | Why Server Components Changed Everything \| DevNotes |
| `title: 'Post not found'` (404 page) | Post not found \| DevNotes |
| nothing (the home page) | DevNotes: learn Next.js by building it |

- **Why:** each page only writes its own name, and the ` | DevNotes` suffix is added the same way everywhere. You can't forget it.
- **Gotcha:** the template only applies to pages in **subfolders** of the layout. `app/page.tsx` is in the same folder as `app/layout.tsx`, so the home page gets `default` instead.
- To skip the template on purpose, write `title: { absolute: 'Exact title' }`.

### `metadataBase`: write short URLs, get full URLs

Canonical and `og:url` must be **full** URLs (`https://devnotes.dev/posts/x`). Google and Slack read them away from your site, so on their own `/posts/x` means nothing.

```ts
// src/app/layout.tsx: write the domain once
metadataBase: new URL(site.url), // site.url = process.env.SITE_URL ?? 'http://localhost:3000'

// any page: write the short path
alternates: { canonical: '/posts' }
```

If you build with `SITE_URL=https://devnotes.dev`, the output is `<link rel="canonical" href="https://devnotes.dev/posts">`.

- **Why:** you write the domain in one place. Local builds use `localhost`, and production builds use the real domain.
- **When is it decided?** When you run `next build`. That's why your homework 1a answer was `https://devnotes.dev/…`.
- I served the production build on port **3005**, but the canonical said `localhost:3000`. Nobody had set `SITE_URL`, so the default was used. That's correct behavior: the canonical should be the site's public address, not whichever server answered.

## 5. What Next.js adds for you

| You write | Next.js also writes |
|---|---|
| nothing | `<meta charset="utf-8">` and the default `<meta name="viewport">` |
| `title`, `description` and an `openGraph` object | `og:title` and `og:description`, copied from them |
| an `openGraph` object | all the `twitter:*` tags |
| nothing (the page is a 404) | `<meta name="robots" content="noindex">` |

## 6. Trap 1: a page's `openGraph` replaces the layout's (measured)

When the layout and the page both set the same field, **the page's value wins, and the layout's value is thrown away completely.** Next.js does not combine what's inside the two objects. (The technical name is a "shallow merge".)

```ts
// the layout sets
openGraph: { siteName: 'DevNotes', locale: 'en_US', type: 'website' }

// the post page (first version) sets
openGraph: { type: 'article', url: '/posts/x' }

// Next.js used only the page's object:
openGraph: { type: 'article', url: '/posts/x' }   // ← siteName and locale are gone
```

Measured: `/about` had `og:site_name`, but the post page didn't.

**The fix:** keep the shared fields in one object, and copy them into every page's `openGraph`:

```ts
// src/lib/site.ts
export const baseOpenGraph = { siteName: site.name, locale: site.locale };

// every page
openGraph: { ...baseOpenGraph, type: 'article', url }
```

For simple text fields like `title` and `description`, replacing is exactly what you want. It only causes trouble for fields that are **objects**: `openGraph`, `robots`, `alternates`.

## 7. Trap 2: the 404 page got the home page's title (measured)

The first version of the post page's `generateMetadata`:

```ts
const post = await getPostBySlug(slug);
if (!post) return {}; // "no post, so no metadata"
```

The page itself still called `notFound()`, so the status was a correct **404** ✅. But the title was "DevNotes: learn Next.js by building it", the **home page's** title ❌.

**Why:** Next.js only uses the 404 page's title (from `not-found.tsx`) when **`generateMetadata` itself** says "not found". Here, `generateMetadata` answered normally with `{}`. Next.js used that answer: it had no title, so the layout's default title was used.

| `generateMetadata` does | Title of `/posts/does-not-exist` |
|---|---|
| `return {}` | DevNotes: learn Next.js by building it ❌ |
| `notFound()` | Post not found \| DevNotes ✅ (from `posts/[slug]/not-found.tsx`) |

**The fix:** `generateMetadata` and the page both call the same helper. It returns the post, or stops with a 404 (or a 308 redirect for an old slug):

```ts
async function loadPost(slug: string): Promise<PostDetail> {
  const post = await getPostBySlug(slug);
  if (post) return post;
  const currentSlug = await getRenamedPostSlug(slug);
  if (currentSlug) permanentRedirect(`/posts/${currentSlug}`); // 308
  notFound();                                                  // 404
}
```

The status codes are the same as on Day 4 (404 and 308). The author and tag pages got the same fix.

**Rule:** in `generateMetadata`, handle a missing item the same way the page does.

## 8. Not a trap: loading the post twice doesn't run two queries (measured)

`generateMetadata` loads the post, and then the page loads it again. Is that two database queries? No. `getPostBySlug` has `'use cache'` (Day 3): the first call saves the result, and the second call reads the saved copy. Measured during the build: **1** `posts.findBySlug` per post.

So you can call your DAL functions in `generateMetadata` freely.

## 9. Good to know

- **Clicking a `<Link>` updates the tags too.** Measured: going from a post to the `#react` tag page changed the tab title to "Posts tagged #react | DevNotes" without a page reload.
- **`keywords`**: Google ignores `<meta name="keywords">`, so we don't set it.
- **Metadata that depends on the visitor** (cookies, the logged-in user): DevNotes has none. If you try it, `next build` stops and asks you to choose how to handle it (homework #4 shows the message). Most sites never need this, because titles and descriptions are the same for everyone.
- **Preview images, `sitemap.xml` and `robots.txt`** are Day 6.

## Cheat sheet

| I want… | Write… | Where |
|---|---|---|
| a page title | `title: 'About'` | page |
| " \| DevNotes" on every title | `title: { template: '%s \| DevNotes', default: '…' }` | root layout |
| a title from the database | `generateMetadata` returning `{ title: post.title }` | the `[slug]` page |
| a summary in search results | `description: '…'` | page |
| one official address per page | `alternates: { canonical: '/posts' }` | page (**never** the root layout) |
| short paths in metadata | `metadataBase: new URL(site.url)` | root layout |
| a good Slack / WhatsApp preview | `openGraph: { ...baseOpenGraph, type, url }` | page |
| an X / Twitter preview | nothing: it's copied from `openGraph` | — |
| a colored address bar on phones | `export const viewport = { themeColor: … }` | root layout |
| keep a page out of Google | `robots: { index: false, follow: true }` | page |
| a proper title on a 404 page | `metadata = { title: 'Post not found' }` in `not-found.tsx`, **and** `notFound()` inside `generateMetadata` | `not-found.tsx` + page |

---

## 📝 Homework

**Write your prediction down before you run anything.** For each answer, say *what* you expect and *why*.

1. **The site's address.** You run `SITE_URL=https://devnotes.dev npm run build`, then `npx next start -p 3005`.
   a. What will the canonical be on `/posts/file-based-routing`?
   b. Will the route table (○ / ◐) change compared to a normal build?
   c. The post page also outputs `<link rel="author" href="/authors/rafael">`. Will that one change too?
   Check with `curl -s localhost:3005/posts/file-based-routing | grep -oE '<link rel="(canonical|author)"[^>]*>'`. Then run a normal `npm run build` to go back.
2. **Thin tag pages.** 4 of the 6 tag pages list only one post. In `tags/[tag]/page.tsx`'s `generateMetadata`, add `robots: { index: false, follow: true }` when a tag has fewer than 2 posts.
   a. Before running it: which tag pages will get `noindex`?
   b. `follow: true` means "you may still follow the links on this page". Why does that matter for the posts those pages link to?
   Check with `curl` and `grep robots`.
3. **Share titles.** The preview card already shows "DevNotes" on its own line (`og:site_name`), so many sites drop the ` | DevNotes` suffix from `og:title`. On the post page, add `title: post.title` inside `openGraph`.
   Before checking: what will `<title>`, `og:title` and `twitter:title` each be? Use §5 to explain `twitter:title`.
4. **Break it.** Add `await connection();` (import it from `next/server`) as the first line of `generateMetadata` in `src/app/posts/[slug]/page.tsx`. `connection()` means "this needs a real visitor's request", so it can't be done at build time.
   a. Will `npm run build` pass?
   b. If not, what does the error suggest? The post page has `ensureStatic = 'navigation'` (Day 4). How does that affect the options?
   c. Would adding `'use cache'` to `generateMetadata` fix it? Read the error text carefully.
   Undo the change afterwards.
5. **Explain back.** In your own words: why did `/posts/does-not-exist` get the home page's title when `generateMetadata` returned `{}`? Which code decided the **404 status**, and which code decided the **title**?
6. *(Bonus)* The four fixed-text pages repeat the same pattern. Write a helper `pageMetadata({ title, description, path })` in `src/lib/site.ts` that returns `title`, `description`, `alternates.canonical` and `openGraph` (with `baseOpenGraph` copied in). Use it in those four pages. Then name one way a helper like this could cause a bug later.

---

## ✅ Homework answers

Given on 2026-11-10. Luis answered #1a himself (correct). The other answers were measured on a production build earlier in the session, or follow directly from those measurements.

### 1. The site's address

- **a.** `https://devnotes.dev/posts/file-based-routing` ✅ (your answer). `metadataBase` is built from `SITE_URL` when `next build` runs, so the canonical gets the production domain, even when the server runs on `localhost:3005`.
- **b.** **No change.** `SITE_URL` only changes the *text* inside some tags. It doesn't add any request-time work, so every ○ page stays ○.
- **c.** **No change:** it stays `<link rel="author" href="/authors/rafael">`. `metadataBase` is only added to fields that must be full URLs, because they're read away from your site (canonical, `og:url`, `og:image`). A normal link like the author link works fine as a short path, because the browser reads it while it's on your site.

### 2. Thin tag pages

```ts
// in generateMetadata of tags/[tag]/page.tsx, inside the returned object
robots: posts.length < 2 ? { index: false, follow: true } : undefined,
```

- **a.** `layouts`, `react`, `server-components` and `typescript` get `<meta name="robots" content="noindex, follow">`. `fundamentals` and `routing` have 2 posts each, so they stay indexable.
- **b.** `noindex` means "don't show *this* page in Google". `follow` means "but do follow its links". Google still uses those tag pages to find the posts they link to. With `nofollow`, they would be dead ends for Google.
- **Should you do it?** It's a judgment call. A page with one link and one line of text is "thin": it adds little in search results next to the post itself. On a 6-tag blog it barely matters. On a site with thousands of tags, it keeps Google focused on the real content.

### 3. Share titles

Add `title: post.title` inside `openGraph` on the post page. Measured:

| Tag | Value | Why |
|---|---|---|
| `<title>` | Why Server Components Changed Everything \| DevNotes | unchanged: the layout's template still applies to the page's main `title` |
| `og:title` | Why Server Components Changed Everything | you set it directly, and the template doesn't apply to `openGraph.title` |
| `twitter:title` | Why Server Components Changed Everything | there's no `twitter` field, so Next.js copies `og:title` (§5) |

### 4. Break it

Measured on `/tags/[tag]`, which has the same `ensureStatic = 'navigation'` setting as the post page.

- **a.** **No, the build fails:** "Next.js encountered uncached or runtime data in `generateMetadata()` on a route that must be fully static."
- **b.** It suggests only **[cache]** and **[static]**. There's no "dynamic marker" option because `ensureStatic = 'navigation'` promises the whole page, metadata included, is built ahead of time. Request-time work would break that promise. (On `/about`, which has no `ensureStatic`, the same mistake also offers the dynamic option.)
- **c.** **No.** The error says the cache fix "does not apply to `connection()`". `connection()` means "wait for a real visitor's request". Caching its result would defeat its purpose, so Next.js doesn't allow it. The only real fix is to remove it: these tags don't depend on the visitor.

### 5. Explain back

Two separate decisions are made for every request:

| Decided by | What it decides | `/posts/does-not-exist`, first version |
|---|---|---|
| the **page** (`<PostContent>` calls `notFound()`) | the **status code** and the page content | 404 ✅, "This post doesn't exist" page ✅ |
| **`generateMetadata`** | the **title** and the other `<head>` tags | returned `{}` → no title → the layout's `default` (the home title) ❌ |

Next.js only replaces the metadata with `not-found.tsx`'s metadata when `generateMetadata` **itself** calls `notFound()`. In the first version it didn't: it returned `{}` normally. So the 404 page got a correct status and body, with the home page's title.

Now both use `loadPost()`, which calls `notFound()`. `generateMetadata` stops too, Next.js uses `posts/[slug]/not-found.tsx`'s metadata, and the title is "Post not found | DevNotes".

### 6. Bonus: the helper

```ts
// src/lib/site.ts
export function pageMetadata({ title, description, path }: {
  title?: string; // optional: the home page uses the layout's default title
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, type: 'website', url: path },
  };
}

// src/app/about/page.tsx
export const metadata = pageMetadata({
  title: 'About',
  description: 'Why DevNotes exists and how the course is organized: one Next.js feature per day.',
  path: '/about',
});
```

Ways it could cause a bug later:
- **The replace trap comes back.** Someone writes `{ ...pageMetadata(…), openGraph: { type: 'article' } }`. That new `openGraph` replaces the helper's whole `openGraph` object, so `siteName`, `locale` and `url` are lost again.
- **A wrong `og:type`.** The helper always uses `'website'`. If someone uses it for a post page, the post gets `og:type: website` and loses its date, author and tags.
- **A wrong address.** `path` is a plain string. A typo (`'/abuot'`) gives the page a canonical pointing to a page that doesn't exist, and nothing warns you.
