// 📘 Day 8: a ROUTE HANDLER. A route.ts file is an HTTP endpoint, not a page:
//   - you export functions named after HTTP methods (GET, POST, PUT, DELETE…)
//   - each one gets a Request and returns a Response (JSON, XML, text, anything)
//   - no layout, no React. Just data.
// This file answers GET /api/posts. Any other method (POST, DELETE…) gets a
// 405 Method Not Allowed automatically.
//
// Who calls it? NOT our own pages (they call the DAL directly, which is faster:
// no extra HTTP request). It's for OTHER programs: a mobile app, another
// website, a script, a partner's dashboard.
import { getPostsByTag, getPublishedPosts } from '@/data/posts';
import { absoluteUrl } from '@/lib/site';

// 📘 IS IT CACHED? Two different saved things (Day 8 homework #1, measured):
//   1. the RESPONSE (the finished JSON). Saved only if the handler doesn't read
//      the request. Before ?tag= this route was ○ (made at build time).
//      Now it reads request.url, so the answer depends on the URL → ƒ: the
//      GET function runs on EVERY request.
//   2. the DATA (getPublishedPosts / getPostsByTag have 'use cache'). Still
//      saved per tag value. So each run is fast: 1st ?tag=react 609 ms (DB),
//      then 3 ms (no DB query).
// ƒ doesn't mean "slow" or "hits the DB". It means "the function runs each time".
export async function GET(request: Request) {
  const tag = new URL(request.url).searchParams.get('tag');
  const posts = tag ? await getPostsByTag(tag) : await getPublishedPosts();
  // 📘 Same DTO rule as pages (Day 2): only public fields. getPublishedPosts
  // already drops drafts and private columns. We add a full `url` for convenience.
  return Response.json(
    {
      posts: posts.map((post) => ({
        ...post,
        url: absoluteUrl(`/posts/${post.slug}`),
      })),
    },
    // 📘 Homework #4 (CORS): lets JavaScript on OTHER websites read this
    // response. Fine for public, read-only data. Never use '*' on endpoints
    // that use cookies or return private data.
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  );
}
