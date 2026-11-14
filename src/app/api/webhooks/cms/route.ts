// 📘 Day 8: a WEBHOOK. Another service calls OUR server when something happens
// on THEIR side. Here: a headless CMS (Contentful, Sanity, Strapi…) where editors
// change post titles. When an editor clicks "Publish", the CMS sends:
//
//   POST /api/webhooks/cms
//   x-webhook-secret: <the shared secret>
//   { "event": "post.updated", "slug": "file-based-routing", "title": "New title" }
//
// We save the change and tell the cache. Nobody is looking at the page right
// now, so there's no "user who must see it immediately".
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { updatePostFromCms } from '@/data/posts';
import { env } from '@/lib/env';

const payloadSchema = z.object({
  event: z.literal('post.updated'),
  slug: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(120).optional(),
  excerpt: z.string().trim().min(1).max(300).optional(),
});

// 📘 This URL is public: anyone on the internet can POST to it. The secret
// proves the request comes from our CMS. It lives in .env.local (never in git).
// timingSafeEqual compares in constant time, so an attacker can't guess the
// secret letter by letter from how long the comparison takes.
function hasValidSecret(request: Request): boolean {
  const expected = env.CMS_WEBHOOK_SECRET; // 📘 Day 12: always set (checked at startup)
  const received = request.headers.get('x-webhook-secret');
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// 📘 POST handlers are never cached, and they can't be prerendered: they run on
// every request (the build table shows ƒ).
export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // request.json() throws on invalid JSON, so .catch turns that into null → 400.
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid payload', issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  const { slug, title, excerpt } = parsed.data;

  // 📘 Day 8 homework #2: zod said "OK" to { slug } with no title and no excerpt,
  // because both are optional. Before this check, that answered 200 "ok", saved
  // nothing, and still expired every `posts` page (measured).
  // The CMS would think it updated something, so tell it the truth: 400.
  if (title === undefined && excerpt === undefined) {
    return Response.json({ error: 'Send a title, an excerpt, or both' }, { status: 400 });
  }
  const found = await updatePostFromCms(slug, { title, excerpt });
  if (!found) {
    return Response.json({ error: `No post with slug "${slug}"` }, { status: 404 });
  }

  // 📘 WHICH TAG? A title is shown almost everywhere: the post page, every list,
  // Trending, the RSS feed, the JSON API, the share picture. All of those cached
  // functions carry the broad `posts` tag, so here the BROAD tag is the right one.
  // (Compare Day 7: a like only changes one number, so it used precise tags.)
  //
  // 📘 WHY revalidateTag(…, 'max') AND NOT updateTag?
  //   - updateTag only works in Server Actions. In a Route Handler it throws.
  //   - Nobody is waiting to see this change. 'max' = the next visitor gets the
  //     old copy once, while a fresh one is made in the background. Every
  //     visitor after that gets the new title. Nobody waits for the DB.
  revalidateTag('posts', 'max');

  return Response.json({ ok: true, revalidated: ['posts'] });
}
