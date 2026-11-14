// 📘 Day 2: The DATA ACCESS LAYER (DAL). Pages and components never touch `db`
// directly. They call these functions, which:
//   1. decide WHAT is visible (only published posts, never drafts)
//   2. return DTOs (Data Transfer Objects): plain objects with only the
//      fields the UI needs. Private columns like `internalNotes` are dropped.
// `server-only` makes the BUILD FAIL if a Client Component ever imports this
// file, so the DB code can never leak into the browser bundle.
//
// 📘 Day 3: every read is now a CACHED function: 'use cache' + cacheLife + cacheTag.
//   - 'use cache'  → the return value is stored and reused ACROSS requests and users
//                    (React.cache only lasted ONE request). The cache key is
//                    function + arguments, so getPostsByTag('react') and
//                    getPostsByTag('routing') are separate entries.
//   - cacheLife()  → HOW LONG the entry is fresh (see the 'blog' profile in next.config.ts)
//   - cacheTag()   → a LABEL, so on Day 7 a mutation can say "everything tagged
//                    'posts' is outdated" with updateTag('posts').
// Because the results can be computed at BUILD time, Next.js puts them straight
// into the prerendered HTML: no DB query when a visitor arrives.
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db, type AuthorRow, type PostRow } from '@/lib/db';

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string; // 📘 Day 11
  publishedAt: string;
  tags: string[];
  author: { id: string; name: string };
};

export type PostDetail = Omit<PostSummary, 'author'> & {
  content: string;
  likes: number;
  authorId: string;
};

function toSummary(post: PostRow, authors: AuthorRow[]): PostSummary {
  const author = authors.find((a) => a.id === post.authorId);
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    cover: post.cover,
    publishedAt: post.publishedAt,
    tags: post.tags,
    author: { id: post.authorId, name: author?.name ?? 'Unknown author' },
  };
}

const byNewest = (a: { publishedAt: string }, b: { publishedAt: string }) => b.publishedAt.localeCompare(a.publishedAt);

// 📘 PARALLEL fetching: posts and authors don't depend on each other, so we
// start both queries at once and wait for both with Promise.all.
// Total time ≈ max(600ms, 300ms) = 600ms, not 600 + 300 = 900ms.
// (Not cached itself: it's an internal helper. The exported functions below cache its result.)
async function findSummaries(where: { authorId?: string; tag?: string } = {}): Promise<PostSummary[]> {
  const [posts, authors] = await Promise.all([
    db.posts.findMany({ ...where, status: 'published' }),
    db.authors.findMany(),
  ]);
  return posts.map((post) => toSummary(post, authors)).sort(byNewest);
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts');
  return findSummaries();
}

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts', `tag:${tag}`);
  return findSummaries({ tag });
}

export async function getPostsByAuthor(authorId: string): Promise<PostSummary[]> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts', `author:${authorId}`);
  return findSummaries({ authorId });
}

export async function getAllTags(): Promise<string[]> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts');
  const posts = await db.posts.findMany({ status: 'published' });
  return [...new Set(posts.flatMap((post) => post.tags))].sort();
}

// 📘 Day 3: "Trending" changes as people like posts, so it gets a SHORTER
// lifetime than the posts themselves. 'minutes' = revalidate every minute.
// That's still long enough (expire ≥ 5 min) to be included in the prerender.
export async function getTrendingPosts(limit = 3): Promise<(PostSummary & { likes: number })[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('posts', 'trending');
  const [posts, authors] = await Promise.all([db.posts.findMany({ status: 'published' }), db.authors.findMany()]);
  return posts
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit)
    .map((post) => ({ ...toSummary(post, authors), likes: post.likes }));
}

// 📘 Day 2 used React.cache here to dedupe calls within ONE request.
// 'use cache' covers that too (same slug → same entry), AND it survives
// across requests, so React.cache is no longer needed for this function.
// Tags: 'posts' (everything) + `post:<slug>` (just this one). On Day 7,
// editing one post will only invalidate `post:<slug>`, not the whole blog.
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts', `post:${slug}`);

  const post = await db.posts.findBySlug(slug);
  // 📘 Authorization lives in the DAL: a draft behaves exactly like a missing post.
  if (!post || post.status !== 'published') return null;

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    cover: post.cover,
    publishedAt: post.publishedAt,
    tags: post.tags,
    likes: post.likes,
    authorId: post.authorId,
  };
}

// 📘 Day 4: when a slug isn't found, it may be an OLD url of a renamed post.
// Returns the current slug so the page can permanentRedirect() there, or null.
// Tagged 'posts' because the answer changes whenever any post is renamed.
export async function getRenamedPostSlug(oldSlug: string): Promise<string | null> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts');
  const post = await db.posts.findByPreviousSlug(oldSlug);
  // A draft that used to be public is still not public: no redirect, just a 404.
  return post && post.status === 'published' ? post.slug : null;
}

// 📘 Day 7: a WRITE. Writes live in the DAL too, for the same reason as reads:
// the DAL decides what's allowed. You can't like a draft or a missing post.
// No 'use cache' here: a write must run every time it's called.
// Returns the new like count, or null if the post isn't public.
export async function likePost(slug: string): Promise<number | null> {
  const post = await db.posts.findBySlug(slug);
  if (!post || post.status !== 'published') return null;
  return db.posts.incrementLikes(slug);
}

// 📘 Day 8: a write that comes from OUTSIDE the site (the CMS webhook), not from
// a visitor. Returns false if there's no such post (drafts are allowed here:
// editors work on drafts in the CMS too).
//
// ⚠️ Trap we hit (measured): the webhook sent only a title, but zod's .optional()
// still gives `{ title: '…', excerpt: undefined }`. Passing that straight to the
// DB wiped the excerpt (Object.assign copies `undefined` too), and the RSS feed
// then crashed on the missing excerpt. So: copy only the fields that were sent.
export async function updatePostFromCms(slug: string, data: { title?: string; excerpt?: string }): Promise<boolean> {
  const changes: { title?: string; excerpt?: string } = {};
  if (data.title !== undefined) changes.title = data.title;
  if (data.excerpt !== undefined) changes.excerpt = data.excerpt;

  const post = await db.posts.update(slug, changes);
  return post !== null;
}

// 📘 Day 10: SEARCH + PAGINATION for /search?q=…&page=…
// The page reads q and page from the URL, cleans them, and passes them in here.
// 'use cache' keys the result on the ARGUMENTS, so "Cache", " cache " and
// "cache" would be 3 entries unless the caller cleans them first (it does:
// see src/app/search/search-params.ts).
export const SEARCH_PAGE_SIZE = 2;

export type SearchResult = {
  posts: PostSummary[];
  total: number; // matches across ALL pages
  page: number; // the page actually shown (out-of-range numbers are clamped)
  pageCount: number;
};

export async function searchPosts(query: string, page: number): Promise<SearchResult> {
  'use cache';
  cacheLife('blog');
  cacheTag('posts');

  const all = await findSummaries();
  const matches = query
    ? all.filter((post) =>
        [post.title, post.excerpt, post.author.name, ...post.tags].some((text) => text.toLowerCase().includes(query)),
      )
    : all; // empty search = browse everything

  const pageCount = Math.max(1, Math.ceil(matches.length / SEARCH_PAGE_SIZE));
  const current = Math.min(page, pageCount); // ?page=99 → the last page
  const start = (current - 1) * SEARCH_PAGE_SIZE;

  return {
    posts: matches.slice(start, start + SEARCH_PAGE_SIZE),
    total: matches.length,
    page: current,
    pageCount,
  };
}
