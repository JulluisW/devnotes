# Day 11: Performance (images, fonts, scripts, lazy loading, animations)

**In one sentence:** DevNotes gets cover pictures and author photos that download **20× smaller** than the files on disk, a third-party-style script that waits until the page is ready, a Scratchpad that loads on its own (and now survives a refresh), animated page changes, and a console log of Google's speed numbers.

Branch: `day-11-performance`. Its first commit is a **snapshot of Day 10 before your homework**. Day 11 is the commit after it. Do Day 10's homework on `day-10-advanced-routing` first; we'll bring the branches together after the review.

> 🔁 **To try it:** `git switch day-11-performance`, then `npm run build` and `npx next start -p 3005`.
> Open DevTools (`Cmd + Option + I`) → **Console**: you'll see `[web-vitals]` and `[page-views]` lines.

---

## ⭐ Must know (4 things)

| # | What | File | One-line job |
|---|---|---|---|
| 1 | `next/image` | `post-card.tsx`, `posts/[slug]/page.tsx`, `author-card.tsx` | serve each picture at the size it's **shown**, in a smaller format, without making the page jump |
| 2 | `next/dynamic` | `components/scratchpad-lazy.tsx` | load a component's code **separately**, and skip the server for browser-only components |
| 3 | `next/script` | `app/layout.tsx` | load third-party scripts **after** the page, so they don't slow it down |
| 4 | Core Web Vitals | `components/web-vitals.tsx` | the 3 speed numbers Google uses for ranking: **LCP, CLS, INP** |

`next/font` is the 5th tool of the day, but there's nothing new to write: the root layout has used it since Day 1 (details below).

Everything after the "Details" heading is **OK to skip for now**.

---

## 1. `next/image`

**The problem:** `public/covers/layouts-that-persist.jpg` is 1600×900 and **95,810 bytes**. A plain `<img>` sends all of it, even into a 160×90 box on a phone.

**What `<Image>` does:** the browser asks `/_next/image?url=…&w=640` and Next.js answers with a **resized, re-compressed copy** (WebP), made once and then cached.

**Measured, same file:**

| Requested | Format | Bytes |
|---|---|---|
| the original `.jpg` | JPEG | 95,810 |
| `w=1920` | WebP | 13,578 |
| `w=640` (what the post page uses on a laptop) | WebP | **4,240** |
| `w=384` (a card thumbnail on a sharp screen) | WebP | 2,308 |
| avatar original `rafael.png` | PNG | 12,737 |
| avatar `w=96` | WebP | **556** |

**Three cases in today's code:**

```tsx
// a) fixed size: the author photo, always 48×48
<Image src={`/avatars/${author.id}.png`} alt="" width={48} height={48} />
// → srcSet: 48 px for normal screens, 96 px for sharp (2x) screens

// b) below the fold: card thumbnails
<Image src={post.cover} alt="" width={160} height={90} />
// → loading="lazy" by default: only downloaded when you scroll near it

// c) the main picture at the top of the post page (the LCP, see #4)
<Image src={post.cover} alt="" width={1600} height={900}
  sizes="(min-width: 768px) 640px, 100vw"   // how wide it's SHOWN
  loading="eager" fetchPriority="high" />   // download it first, don't wait
```

- **`width` / `height`** = the picture's proportions. The browser reserves the box **before** the file arrives, so the text under it doesn't jump down (that jump is what CLS measures).
- **`sizes`** = how wide the image is **shown**. Without it, the browser assumes "the whole screen wide" and may pick a much bigger copy.
- **`fetchPriority="high"`**. Measured: Next.js also added `<link rel="preload" as="image" …>` to the `<head>`, so the download starts before the browser even reaches the `<img>`.
- **`alt=""`** means "decorative": screen readers skip it. Use real alt text when the picture carries information.

**Use it for:** every picture in your pages.
**Avoid:** `loading="eager"` / `fetchPriority="high"` on more than the one main picture. If everything is "first", nothing is.

## 2. `next/dynamic`: load a component later

The Scratchpad now saves to `localStorage`, so your notes survive a refresh. But `localStorage` **only exists in the browser**. Rendering it on the server would crash. So:

```tsx
// components/scratchpad-lazy.tsx ('use client')
export const LazyScratchpad = dynamic(() => import('./scratchpad').then((mod) => mod.Scratchpad), {
  ssr: false,                      // don't render on the server at all
  loading: () => <div className="h-[124px] …" />,  // placeholder, same height
});
```

**Measured:**
- the server's HTML for `/posts` contains the grey placeholder, not the Scratchpad
- the Scratchpad's code is a separate file (880 bytes), and the `/posts` HTML doesn't load it up front
- typed "remember me", refreshed: still there

**Use it when:** a component only works in the browser (`localStorage`, `window`, a chart library), or it's big and not needed right away (an editor, a map, a modal's content).
**Avoid:** for content that must be in the HTML (text Google should read, the comment form that works without JS).
**Rule:** `ssr: false` is only allowed in a **Client Component**, which is why the tiny wrapper file exists.

## 3. `next/script`: third-party scripts last

Analytics, chat widgets and ads are other people's JavaScript. They don't help the visitor see your page, so they shouldn't compete with it.

```tsx
<Script src="/scripts/page-views.js" strategy="lazyOnload" />
```

| strategy | When it loads | Use it for |
|---|---|---|
| `afterInteractive` (default) | soon after the page becomes interactive | analytics you need early (tag managers) |
| `lazyOnload` | when the browser is idle, after the page loaded | chat widgets, "nice to have" scripts |
| `beforeInteractive` | before the app's own code | almost never (bot detection, cookie banners) |

**Measured:** the page finished loading, and `page-views.js` was requested about **1 s later**. The console says `[page-views] script ran 1011 ms after the page started loading`.

`<Script>` loads each file **once**, even when you click between pages. It's not loaded again on every page.

## 4. Core Web Vitals: the numbers that matter

| Name | Question it answers | Good | Today's fix |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | when did the main content appear? | ≤ 2.5 s | `fetchPriority="high"` on the cover, WebP copies |
| **CLS** (Cumulative Layout Shift) | how much did things jump while loading? | ≤ 0.1 | `width`/`height` on every `<Image>`, a same-height Scratchpad placeholder |
| **INP** (Interaction to Next Paint) | after a click, how long until the screen reacts? | ≤ 200 ms | less JavaScript to run (lazy Scratchpad, late scripts) |

`components/web-vitals.tsx` uses `useReportWebVitals` to log them. Measured in the console: `[web-vitals] TTFB 27 ms (good)`, `FCP 160 ms (good)`, `INP 40 ms (good)`.

**Note:** LCP and CLS are logged when you **leave or hide** the tab, because they can still change until then. Switch to another tab and back to see them.

---

## Details (OK to skip for now)

- **`next/font`** (since Day 1, in `app/layout.tsx`): the Geist font files are downloaded at **build** time and served from your own site (`/_next/static/media/…woff2`). Measured: the page's response tells the browser to preload the 2 font files (an HTTP `Link` header). No request to Google, no visitor IP sent to Google, no flash of a different font.
- **View Transitions (React's `<ViewTransition>`), added but not measured to the end:**
  - the post title in `<PostCard>` and the post page's `<h1>` share a `name`, so the browser can move the title from the card to the heading
  - the post page's skeleton slides out and the content slides in
  - CSS lives in `globals.css`, and "reduce motion" turns it all off
  - I could confirm that a transition **starts** with the two titles paired when going **back** to `/posts`, but my test browser was hidden, and hidden browsers don't play animations. **Watching it is homework #3.**
  - The docs say the title move only plays when the new page is ready **at the moment of the click**. Our post content streams in a moment later, so on a first visit you'll probably see the slide-in instead.
- **Prefetching:** links prefetch the page's static shell by default. `<Link prefetch={true}>` also prefetches the parts that depend on the URL (`params`, `searchParams`). It costs one server request per visible link, so use it only for the links people click most.
- **Bundle analyzer:** `npx next analyze` opens a map of every JavaScript file and what's inside it. `npx next analyze --output` saves it to `.next/diagnostics/analyze`. Use it when a page feels heavy: look for one big library you only need on one page, then `dynamic()` it.
- **Next.js 16 changes:** `priority` on `<Image>` is deprecated (`preload`, or better `fetchPriority="high"`, replace it). `images.qualities` defaults to `[75]`: other `quality` values are rounded to the closest allowed one.
- **How the demo pictures were made:** a small script with `sharp` (the image library Next.js uses itself) drew gradients and initials. They're plain files in `public/covers/` and `public/avatars/`.

---

## Cheat sheet

| I want… | Write… |
|---|---|
| a fixed-size picture | `<Image src alt width={48} height={48} />` |
| a picture that fills a column | `<Image … width={1600} height={900} sizes="(min-width: 768px) 640px, 100vw" className="w-full" />` |
| the main picture loads first | `loading="eager" fetchPriority="high"` (one per page) |
| a decorative picture | `alt=""` |
| a browser-only component | `dynamic(() => import('./x'), { ssr: false, loading })` in a `'use client'` file |
| a third-party script | `<Script src strategy="lazyOnload" />` |
| see the speed numbers | `useReportWebVitals` in a Client Component, or DevTools → Lighthouse |
| a font | `next/font/google` or `next/font/local` in the root layout |
| ❌ `<img>` for your own pictures | `<Image>` |
| ❌ `priority` | `fetchPriority="high"` |

---

## 📝 Homework

Short ones. **Predict, then check, and add a "because…".**

1. **Image sizes.** Open a post, then DevTools → **Network** tab → filter **Img** → refresh.
   a. Which `w=` does the cover use, and what's its **Size**? Compare it with the original: open `localhost:3005/covers/file-based-routing.jpg` (that's the full file).
   b. Make the browser window narrow (like a phone) and refresh. Does `w=` change? Because…?
2. **Lazy loading.** On `/posts`, make the window short so only one card fits, refresh, and watch the Img list. Scroll down slowly. When do the other thumbnails appear in the list? Because…?
3. **Watch the animation** (I couldn't). On `/posts`, click a post title. Do you see the title move, or the post slide in? Click **Posts** in the header to go back. Which animation do you see this time?
4. **Speed numbers.** Open a post with the Console open, switch to another tab and back. Write down LCP and CLS. Are they "good"? *Bonus:* DevTools → **Lighthouse** → Analyze page load. What's the Performance score?

---

## ✅ Homework review

| # | Your answer | Result |
|---|---|---|
| 1a | `w=1920`, though DevTools shows the image 604 px wide | ✅ measured right. The reason is below |
| 1b | narrow window → smaller `w` (`w=1200` on iPhone 16) | ✅ |
| 2 | couldn't see the lazy loading, added `loading="eager"` | 🟡 not your fault: my question couldn't work with 4 posts. See below |
| 3 | the title animates, and you **added a cover-image morph** yourself | ✅ nice. It's kept in `post-card.tsx` and the post page |
| 4 | CLS **0.922 (poor)**, LCP 168 ms (good). "Maybe the image dimensions? DevTools blames `main`." | ✅ **You found a real bug I shipped.** The cause wasn't the images. See below. Now fixed |

### #1: how the browser picks `w=`

The browser does the math, not Next.js:

```
size it's shown at (from `sizes`)  ×  screen sharpness (pixel density)  =  pixels needed
then: pick the smallest copy in the srcset list that is at least that big
```

| Screen | `sizes` says | Density | Needed | Smallest copy that's big enough |
|---|---|---|---|---|
| your Mac | 640px | 2× (Retina) | 1280 | **1920** (the list goes … 1080, 1200, **1920** …) |
| iPhone 16 | 100vw = 393px | 3× | 1179 | **1200** |

- **Why DevTools says 604 px:** `sizes` is an estimate ("about 640px"). The real column is 604 px wide. Close enough, and 604 × 2 = 1208 would still need the 1920 copy.
- **The copies:** Next.js makes each copy the first time a browser asks for it, then keeps it. They aren't made "at a threshold".

### #2: why you couldn't see lazy loading

Chrome doesn't wait until a lazy image is **on** the screen. It starts loading it when it's **close**: within about 1250 px of the window, or more on slow connections, so the image is ready by the time you scroll to it. `/posts` has only 4 cards, so all 4 thumbnails are always "close", and Chrome loads them right away. I measured this on Day 11 too: all 4 loaded on the first page load. The browser cache made it even harder to see (DevTools → Network → **Disable cache** fixes that part).

So lazy loading works, but you need a long page to see it. `loading="eager"` on the thumbnails would turn it off for real, so I removed it. **Keep `eager` / `fetchPriority="high"` for the one main picture only.**

### #4: the CLS bug (0.922), and the fix

Measured on your code: **CLS 0.846** at 1024×768. The layout-shift log showed what moved:

| Element | Before | After |
|---|---|---|
| `main` + the header's container | x = 64 | x = **57** (7 px left) |
| footer | visible at the bottom | pushed **off-screen** |

**What happened, step by step:**
1. The page first painted with the post's **skeleton** (3 short grey bars). The whole page fit in the window, so there was no scrollbar and the footer was visible.
2. About 50 ms later, the post replaced the skeleton. The page became taller than the window, so a **scrollbar appeared**, and the window got 15 px narrower.
3. Everything centered (`mx-auto`) moved 7 px left, and the footer jumped down. `main` covers almost the whole screen, so even 7 px gives a big score. That's why DevTools named `main` (it's the element that **moved**, not the cause).

**Not the images:** they have `width`/`height`, so their box is reserved before they load. That's exactly what those two props are for.

**Two fixes:**
- `globals.css`: `html { scrollbar-gutter: stable; }` keeps the scrollbar's space reserved from the start, so the width never changes.
- `skeletons.tsx`: `<PostSkeleton withCover />` is now about as tall as the real post (a 16:9 cover box + title + 5 lines). The page is long from the first paint, so the footer starts below the fold.

**Measured after the fix:**

| Page | Window | CLS before | CLS after |
|---|---|---|---|
| `/posts/why-server-components` | 1024×768 | 0.846 | **0.003** |
| `/posts/file-based-routing` | 1024×768 | | **0** |
| `/posts/why-server-components` | phone (375 wide) | | **0** |

**The lesson:** a skeleton is a promise about the page's shape. If it's much shorter than the real content, everything below it jumps when the content arrives.
