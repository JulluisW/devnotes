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
export const baseOpenGraph = {
  siteName: site.name,
  locale: site.locale,
} satisfies Metadata['openGraph'];
