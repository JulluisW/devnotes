# DevNotes: a Next.js mentorship course

**DevNotes** is a small developer blog. It's built to be simple to understand and to give every big Next.js feature a real job. Each day adds one layer to the app. By the end, it's a production-shaped, SEO-optimized, full-stack Next.js 16 + TypeScript app.

**Stack:** Next.js 16.4 (App Router, Cache Components, Partial Prefetching) · React 19 · TypeScript (strict, typed routes) · Tailwind CSS v4

## How each day works

1. **Concept**: what the feature is and *why* it exists. What problem does it solve?
2. **Build**: we add the feature to DevNotes. Comments in the code that start with `// 📘` mark the teaching points.
3. **Observe**: you run the app and watch the behavior. A teaching point you saw for yourself sticks better than one you only read.
4. **Homework**: a small task you do on your own. Next session, we review it before moving on.

## Curriculum

| Day | Topic | What DevNotes gains | Status |
| --- | --- | --- | --- |
| 1 | **Foundations**: App Router, file-based routing, layouts, pages, Server vs Client Components, `<Link>`, dynamic routes | Home, posts list, post detail, about page, shared header | ✅ Done |
| 2 | **Data layer**: async Server Components, a fake DB, `React.cache`, parallel vs sequential fetching, `server-only` | Authors pages, async fake DB, DAL with DTOs, streaming | ✅ Done |
| 3 | **Rendering & caching**: Partial Prerendering, static shell, `<Suspense>` streaming, `use cache`, `cacheLife`, `cacheTag` | Cached DAL (custom `blog` profile, tags), trending + live widgets, cached TagCloud | ✅ Done |
| 4 | **Loading & error UX**: `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `catchError`, `notFound()` / `permanentRedirect()`, status codes vs streaming, `ensureStatic` | Real 404/308 status codes, nested error boundaries, widget-level boundary, failure switches | ✅ Done |
| 5 | **SEO I: Metadata API**: static `metadata`, `generateMetadata`, title templates, canonical URLs, Open Graph, Twitter cards, `viewport` | Every page has correct, unique metadata (title template, canonical, Open Graph, 404 titles, theme color) | ✅ Done |
| 6 | **SEO II: crawlers & rich results**: `robots.ts`, `sitemap.ts`, dynamic OG images (`opengraph-image` + `ImageResponse`), JSON-LD structured data | robots.txt, sitemap.xml, a preview picture for every page and post, BlogPosting JSON-LD | ✅ Done |
| 7 | **Mutations**: Server Actions, `<Form>`, `useActionState`, `useOptimistic`, Zod validation, `updateTag` / `revalidateTag` / `refresh` | Comments and likes that persist | ⏳ |
| 8 | **Route Handlers**: `route.ts`, HTTP methods, caching GET handlers, webhooks, BFF pattern | Public JSON API and RSS feed (moved here from Day 6) | ⏳ |
| 9 | **Auth & Proxy**: `proxy.ts` (formerly middleware), cookies, sessions, Data Access Layer, protecting routes and actions | Login and an author dashboard | ⏳ |
| 10 | **Advanced routing**: route groups, parallel routes (`@slot`), intercepting routes (modals), `searchParams` search and pagination | Dashboard with slots, post-preview modal, search | ⏳ |
| 11 | **Performance**: `next/image`, `next/font`, `next/script`, lazy loading, prefetching, View Transitions, bundle analysis | Fast Core Web Vitals | ⏳ |
| 12 | **Production**: env vars, `instrumentation.ts`, testing (Vitest + Playwright), deployment, production checklist | Ship-ready app | ⏳ |

## Running the app

```bash
npm run dev     # development server at http://localhost:3000
npm run build   # production build (shows which routes are static vs dynamic)
npm run start   # serve the production build
```

> 💡 Run `npm run build` often while learning. Its route table shows how Next.js decided to render each route, and that's the fastest way to build intuition.

## Lesson notes

- [Day 1: Foundations](./day-01-foundations.md)
- [Day 2: The Data Layer](./day-02-data-layer.md) (includes the Activity warm-up)
- [Day 3: Rendering & Caching](./day-03-caching.md)
- [Day 4: Loading & Error UX](./day-04-loading-error.md)
- [Day 5: SEO I, the Metadata API](./day-05-metadata.md)
- [Day 6: SEO II, crawlers & share previews](./day-06-seo-crawlers.md)
