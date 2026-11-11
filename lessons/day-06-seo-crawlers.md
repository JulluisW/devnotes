# Day 6: Helping Google and share previews (SEO II)

**In one sentence:** Day 5 described each page. Day 6 adds files that help Google **find** every page and **understand** each post, and gives every link a **picture** when it's shared.

Branch: `day-06-seo-crawlers` (from `day-05-metadata`).

---

## ⭐ Must know (4 things)

| # | What | File | One-line job |
|---|---|---|---|
| 1 | robots.txt | `app/robots.ts` | tells crawlers what they may visit, and where the sitemap is |
| 2 | sitemap.xml | `app/sitemap.ts` | the list of every page you want in Google |
| 3 | Preview pictures | `opengraph-image.tsx` | the picture in the Slack / WhatsApp / X card |
| 4 | JSON-LD | `<JsonLd>` in the post page | tells Google "this is a blog post, by this author, from this date" |

Everything after the "Details" heading is **OK to skip for now**.

All four reuse things you already know: the cached DAL (Day 3), `generateStaticParams` (Day 1) and `baseOpenGraph` (Day 5).

---

## 1. robots.txt: the note for crawlers

- **What it does:** a small text file at `/robots.txt`. Crawlers read it **before** any page. It says which paths they may visit, and where the sitemap is.
- **You write** (`src/app/robots.ts`):
  ```ts
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: '*', allow: '/' },  // every crawler may visit everything
      sitemap: absoluteUrl('/sitemap.xml'),
    };
  }
  ```
- **Visitors get** (measured, `curl localhost:3005/robots.txt`):
  ```
  User-Agent: *
  Allow: /

  Sitemap: http://localhost:3005/sitemap.xml
  ```
- **Use it:** on every site, even if it allows everything, so crawlers can find the sitemap.
- **Use `disallow` for:** pages that waste a crawler's time, like internal search results or endless filter combinations.
- **⚠️ Avoid:** using it to **hide** a page from Google. It doesn't work:
  - A disallowed page can still show up in Google as a bare link if other sites link to it.
  - Google isn't allowed to open the page, so it never sees the page's `noindex` tag.
  - To keep a page out of results, use `robots: { index: false }` in the page's metadata (Day 5 homework #2).

## 2. sitemap.xml: the list of pages

- **What it does:** a file at `/sitemap.xml` listing every page you want Google to know about. Google still finds pages by following links. The sitemap makes sure none are missed, and `lastModified` tells Google which pages changed.
- **You write** (`src/app/sitemap.ts`, shortened):
  ```ts
  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [posts, authors] = await Promise.all([getPublishedPosts(), getAuthors()]);
    return [
      { url: absoluteUrl('/') },
      ...posts.map((post) => ({ url: absoluteUrl(`/posts/${post.slug}`), lastModified: post.publishedAt })),
      ...authors.map((author) => ({ url: absoluteUrl(`/authors/${author.id}`) })),
      // + /posts, /authors, /about, and the tag pages with 2 or more posts
    ];
  }
  ```
- **Visitors get** (measured: 13 URLs):
  ```xml
  <url><loc>http://localhost:3005/posts/why-server-components</loc><lastmod>2026-10-28</lastmod></url>
  <url><loc>http://localhost:3005/posts/file-based-routing</loc><lastmod>2026-10-21</lastmod></url>
  …
  ```
- **What's NOT in it, and why:**
  - **The draft post.** The DAL hides drafts, so the sitemap never sees them.
  - **The 4 tag pages with only one post.** They have `noindex` (Day 5 homework #2). Don't put a page in the list you hand to Google while also telling Google not to show it. Both places use the same `minPostsForTagPage` constant in `site.ts`, so they can't disagree.
- **It updates itself.** It reads the same cached DAL as the pages, so a new post appears in the sitemap automatically.
- **Use it:** on any site that wants search traffic.
- **Avoid:** listing 404s, redirects or `noindex` pages. Skip `changeFrequency` and `priority`: Google ignores them.

## 3. Preview pictures: `opengraph-image.tsx`

- **What it does:** a file named `opengraph-image.tsx` becomes a URL that returns a **PNG picture**. You "draw" the picture with JSX, and `ImageResponse` turns it into a PNG.
- **DevNotes has two:**

  | File | URL | Picture |
  |---|---|---|
  | `app/opengraph-image.tsx` | `/opengraph-image` | the site-wide picture |
  | `app/posts/[slug]/opengraph-image.tsx` | `/posts/<slug>/opengraph-image` | one per post: title, author, date, tags |

  The per-post picture (measured, saved from the production build):

  ![Preview picture of a post](./img/day-06-og-post.png)

- **You write** (shortened):
  ```tsx
  // app/posts/[slug]/opengraph-image.tsx
  export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);  // same cached DAL as the page
    return new ImageResponse(<OgCard title={post.title} footer="Maya Chen · October 28, 2026 · #react" />, ogImageSize);
  }
  ```
  The design lives in `src/components/og-card.tsx`. It's normal JSX with three differences, because it's turned into a picture and never shown in a browser:
  - only inline `style={{ }}`: no Tailwind classes
  - only flexbox: no grid
  - every `<div>` with more than one child needs `display: 'flex'`
- **Pages point to their picture** through `openGraph.images`:
  - every page gets the site picture from `baseOpenGraph`
  - the post page replaces it with the post's own picture
- **What you get for free** (measured): once a page has an `og:image`, Next.js copies it into `twitter:image`, and **`twitter:card` switches from `summary` to `summary_large_image`** on its own. That's why Day 5 said not to set `twitter.card` by hand.
- **Use it:** for pages people share. A link with a picture gets far more attention in a chat than a text-only card.
- **Size:** 1200 × 630 px. Facebook, LinkedIn, Slack and X all expect this size.

## 4. JSON-LD: describing the post to Google

- **What it does:** a hidden block of JSON in the page that describes the content in a fixed vocabulary from **schema.org**. Visitors never see it. Google can use it for richer search results, like showing the date and author with the result.
- **The difference from metadata:** `<title>` and `description` are free text for humans. JSON-LD is structured facts for machines: "type: blog post, author: a person named Maya Chen, published: 2026-10-28".
- **Output on a post page** (measured, formatted for reading):
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Why Server Components Changed Everything",
    "description": "Server Components let you fetch data and render UI on the server…",
    "datePublished": "2026-10-28",
    "url": "http://localhost:3005/posts/why-server-components",
    "image": "http://localhost:3005/posts/why-server-components/opengraph-image",
    "keywords": ["react", "server-components"],
    "author": { "@type": "Person", "name": "Maya Chen", "url": "http://localhost:3005/authors/maya" }
  }
  ```
- **You write:**
  ```tsx
  <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, … }} />
  ```
  `src/components/json-ld.tsx` renders `<script type="application/ld+json">`. **Always use this component; don't write the `<script>` by hand.** It escapes `<`, so a post title containing `</script>` can't break out of the tag and inject HTML (an XSS hole).
- **Every URL inside must be a full URL**, so it uses `absoluteUrl()` from `site.ts`. (`metadataBase` only works inside `metadata` objects.)
- **Use it:** on content pages Google has a type for: articles, products, recipes, events, people, organizations.
- **Avoid:** describing things that aren't on the page, like fake ratings. Google can penalize that.

---

## Two traps we hit (both measured)

### Trap 1: the picture disappeared from most pages

After adding `app/opengraph-image.tsx`, only `/` had a picture:

| Page | `og:image` | `twitter:card` |
|---|---|---|
| `/` | ✅ site picture | summary_large_image |
| `/about`, `/posts`, `/authors/maya`, `/tags/react` | ❌ none | summary |

**Why:** it's the Day 5 "replace" trap again. Next.js attaches the picture to the layout's `openGraph`. But those pages set their own `openGraph` object (for `og:url`), and a page's object **replaces** the layout's, picture included.

**The fix:** put the picture into `baseOpenGraph`, which every page already copies in:

```ts
// src/lib/site.ts
export const baseOpenGraph = {
  siteName: site.name,
  locale: site.locale,
  images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'DevNotes: learn Next.js by building it' }],
};
```

After the fix, every page has a picture. The post page sets `images` to its own picture.

### Trap 2: the post pictures were redrawn on every request

The first build listed the per-post picture as **`ƒ`** (made per request):

| | Build symbol | 1st request | DB queries |
|---|---|---|---|
| without `generateStaticParams` | `ƒ` | **1.3 s** | 2 |
| with `generateStaticParams` | `●` (made at build time) | **12 ms** | 0 |

**Why:** `opengraph-image.tsx` is its **own route**, separate from `page.tsx`, so it doesn't reuse the page's `generateStaticParams`. Without its own copy, Next.js doesn't know which slugs exist at build time.

**The fix:** add the same `generateStaticParams` to the image file.

> 💡 Rule for both traps: **when you add a new file next to a page, check the build table (○ ● ƒ) and `curl` the page.** Neither problem showed an error. They were only visible in the output.

---

## Details (OK to skip for now)

- **The 404 picture:** a missing post's 404 page pointed `og:image` at `/posts/<missing>/opengraph-image`, which is itself a 404. `posts/[slug]/not-found.tsx` now sets `openGraph: { ...baseOpenGraph }` to use the site picture.
- **`twitter-image.tsx`:** the same as `opengraph-image`, but only for X. You don't need it; X uses the Open Graph picture.
- **`icon.png` / `apple-icon.png` / `favicon.ico` in `app/`:** browser-tab and home-screen icons. DevNotes keeps the default favicon.
- **`manifest.ts`:** makes the site installable as an app on phones (name, colors, icons). It isn't needed for SEO.
- **Big sites:** one sitemap holds up to 50,000 URLs. Above that, `generateSitemaps` splits it into several files.
- **Custom fonts in pictures:** `ImageResponse` uses Geist by default (the same font as the site). Other fonts must be loaded as `.ttf` / `.otf` files.
- **Testing JSON-LD:** Google's Rich Results Test and validator.schema.org check it. They need a public URL, or you can paste the code into them.
- **RSS** moved to Day 8, where it fits with Route Handlers.

---

## Cheat sheet

| I want… | Write… |
|---|---|
| tell crawlers where my sitemap is | `app/robots.ts` returning `{ rules, sitemap }` |
| stop crawlers wasting time on a path | `disallow: '/search'` in `robots.ts` |
| keep a page **out of Google results** | `robots: { index: false }` in the **page's metadata** (not robots.txt) |
| a list of all my pages for Google | `app/sitemap.ts` returning `[{ url, lastModified }]` from the DAL |
| a picture in link previews | `opengraph-image.tsx` next to the page, plus `images` in `openGraph` |
| a different picture per post | `app/posts/[slug]/opengraph-image.tsx` with `params` **and** `generateStaticParams` |
| tell Google "this is an article by X on date Y" | `<JsonLd data={{ '@type': 'BlogPosting', … }} />` |
| a full URL outside `metadata` | `absoluteUrl('/path')` from `site.ts` |

---

## 📝 Homework

**Write your prediction first**, then check. One or two sentences per answer is enough.

1. **Publish the draft (predict, then check).** In `src/lib/db.ts`, change the `data-access-layer` post's `status` from `'draft'` to `'published'`. Its tags are `security` and `architecture`. Before building, predict:
   a. Will it appear in `/sitemap.xml`? How many URLs will the sitemap have?
   b. Will `/tags/security` be in the sitemap? Will it have `noindex`?
   c. Will the build table show a `●` picture for it?
   Check with `npm run build && npx next start -p 3005`, `curl -s localhost:3005/sitemap.xml`, and `curl -s localhost:3005/tags/security | grep robots`. **Set it back to `'draft'` afterwards.**
2. **Author JSON-LD (small coding task).** On `src/app/authors/[id]/page.tsx`, add a `<JsonLd>` that describes the author as a schema.org **`Person`**, with `name`, `jobTitle` (use `author.role`), `description` (the bio) and `url` (use `absoluteUrl`). Check it with `curl` and `grep ld+json`.
3. **Break it (predict only).** Imagine you delete the `images` line from `baseOpenGraph` in `site.ts`. Which pages would still have a picture, and why? (Hint: trap 1.)
4. **Theory.** You want `/tags/react` out of Google's results. Option A: add `disallow: '/tags/react'` to `robots.ts`. Option B: `robots: { index: false }` in the tag page's metadata (what we did). Which one works, and why doesn't the other?
5. *(Bonus)* Change the design in `og-card.tsx`, for example the colors or a "Read on DevNotes →" line at the bottom. Open `localhost:3005/posts/why-server-components/opengraph-image` in the browser to see the result. Remember: inline styles and flexbox only.

---

## ✅ Homework review

| # | Your answer | Result |
|---|---|---|
| 1a | Sitemap grows by 1 URL (the post). Tags don't get added. | ✅ Right: 13 → 14 URLs |
| 1b | `/tags/security` not in the sitemap, has `noindex` | ✅ Right |
| 1c | (not answered) | Yes, a `●` picture. The picture's `generateStaticParams` reads the same `getPublishedPosts()` |
| 2 | Author JSON-LD | ✅ Works (checked with curl). Small cleanup below |
| 3 | Only the post pages keep a picture | 🟡 Half right: `/` keeps it too |
| 4 | B, because A can still show the URL as a bare link | ✅ Right. One more piece below |
| 5 | Changed a color | 🟡 Built fine, but the picture didn't change. See below |

### #1c: why the draft gets a picture automatically

The picture file has its own `generateStaticParams()`, and it calls `getPublishedPosts()`. Publishing the post adds it to that list, so the build makes its picture too. You don't have to do anything for new posts.

### #2: what I cleaned up

Your version worked. Four small fixes:

- **`import { type Author, ... }`**: `Author` is only a type, so mark it with `type`. It's the same note as `import type` on Day 2.
- **No `async`, no `<Suspense>`**: `AuthorJsonLd` doesn't `await` anything, because the author is already loaded. So it's a normal component. Use Suspense only around something that waits.
  - The post page's `PostJsonLd` *does* need Suspense, because it calls `await getAuthor()`.
- **`author.name`, not `author?.name`**: `author` can't be `null` there, because of the `notFound()` above. `?.` would hide a real bug if it ever were `null`.
- Removed the commented-out line.

### #3: measured, with the `images` line removed

| Page | Has a picture? | Why |
|---|---|---|
| `/` | ✅ yes | `app/opengraph-image.tsx` is in the **same folder** as `app/page.tsx`. A picture file always applies to its own folder's page. |
| `/posts/why-server-components` | ✅ yes | The post page sets its own `images` |
| `/about`, `/posts`, `/authors`, `/authors/maya`, `/tags/react` | ❌ no | They set their own `openGraph`, which **replaces** the layout's, picture included (trap 1) |
| `/posts/nope` (404) | ⚠️ broken | Its og:image points back at the 404 picture |

**Rule:** a picture file covers its own folder for sure. Pages in other folders keep it only if they don't set `openGraph`, or if they copy `baseOpenGraph` (which is why `images` lives there).

### #4: the missing piece

You got the result right. Here is the reason behind it:

- **A (`disallow`)** tells Google "don't open this page". So Google never sees the `noindex` inside it. It still knows the URL from other links, so it can list it without a description.
- **B (`noindex`)** lets Google open the page, read "don't list me", and remove it.

So **never combine them**: `disallow` would hide the `noindex`.

### #5: why your color didn't show, and how to test

You added `color: 'red'` to the **dot**. The dot has no text, so `color` does nothing. The dot's color comes from `background`. Try `background: 'red'` on it.

**How to test:** WhatsApp can't see your laptop (`localhost`). Open the picture URL in the browser instead:

1. Run `npm run dev` (port 3000). In dev, the picture is redrawn every time you save.
2. Open `http://localhost:3000/posts/why-server-components/opengraph-image`.
3. Edit `og-card.tsx`, save, and refresh.

On `next start`, the picture is made at **build time** (`●`). So you must run `npm run build` again to see a change there.

To test the real WhatsApp/X preview, the site has to be online (Day 12, deploy). Then tools like opengraph.xyz show how it looks on each app.
