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
    publishedAt: post.publishedAt,
    tags: post.tags,
    likes: post.likes,
    authorId: post.authorId,
  };
}
