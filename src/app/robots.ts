// 📘 Day 6: this file becomes /robots.txt, a small text file that crawlers
// (Google, Bing…) read FIRST, before any page. It says:
//   - which paths they may visit ("allow" / "disallow")
//   - where the sitemap is
//
// DevNotes has nothing to hide yet, so everything is allowed. On Day 9 the
// author dashboard arrives, but it's behind a login, so it doesn't need a rule.
//
// ⚠️ robots.txt is NOT the way to keep a page out of Google. A disallowed page
// can still appear in results (as a bare link) if other sites link to it, and
// Google can't read its `noindex` tag because it isn't allowed to open it.
// To hide a page from results, use `robots: { index: false }` in its metadata.
import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
