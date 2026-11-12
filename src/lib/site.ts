// 📘 Day 5: facts about the whole site that metadata uses on many pages.
// Keeping them in one place means every page uses the same name, address and
// language.
import type { Metadata } from 'next';

export const site = {
  name: 'DevNotes',
  description: 'A developer blog for learning Next.js, one day at a time.',
  // 📘 The public address of the site. It's used to build the full URLs in the
  // canonical and og:url tags. In production this would be https://devnotes.dev.
  // It's read when you run `next build`, so set SITE_URL before building.
  // (Day 12 covers environment variables.)
  url: process.env.SITE_URL ?? 'http://localhost:3005',
  locale: 'en_US',
};

// 📘 The preview-card fields that every page shares.
// Why this exists: when a page sets `openGraph`, its object REPLACES the layout's
// openGraph completely. The two objects are not combined. So every page writes
//   openGraph: { ...baseOpenGraph, type, url }
// to copy siteName and locale back in.
//
// 📘 Day 6: the picture is in here for the same reason. app/opengraph-image.tsx
// draws the site-wide picture, but when a page sets its own `openGraph`, the
// picture is replaced away too (measured: /about, /posts, authors and tags had
// no og:image). Listing it here puts it back on every page. Posts replace
// `images` with their own picture.
export const ogImageSize = { width: 1200, height: 630 };

export const baseOpenGraph = {
  siteName: site.name,
  locale: site.locale,
  images: [{ url: '/opengraph-image', ...ogImageSize, alt: `${site.name}: learn Next.js by building it` }],
} satisfies Metadata['openGraph'];

// 📘 Day 8: tells feed readers "this site has an RSS feed at /feed.xml".
// Output: <link rel="alternate" type="application/rss+xml" title="DevNotes" href="…/feed.xml">
// Used in `alternates.types` on the home page and /posts, the pages people paste
// into a feed reader. (Not in the layout: every page sets its own `alternates`,
// which REPLACES the layout's, the same trap as openGraph on Day 5.)
export const rssAlternate = {
  'application/rss+xml': [{ url: '/feed.xml', title: site.name }],
} satisfies NonNullable<Metadata['alternates']>['types'];

// 📘 Day 6: turns a path like "/posts/x" into a full URL like
// "http://localhost:3005/posts/x". sitemap.xml and JSON-LD need full URLs, and
// metadataBase (Day 5) only works inside `metadata` objects, so they use this.
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

// 📘 Day 6: a tag page needs at least this many posts to be shown in Google.
// Two places use it and must agree: the tag page's `robots` tag (Day 5
// homework #2) and sitemap.ts. Don't list a page in the sitemap while also
// telling Google not to show it.
export const minPostsForTagPage = 2;
