// 📘 Day 2: The DATA ACCESS LAYER (DAL). Pages and components never touch `db`
// directly. They call these functions, which:
//   1. decide WHAT is visible (only published posts, never drafts)
//   2. return DTOs (Data Transfer Objects): plain objects with only the
//      fields the UI needs. Private columns like `internalNotes` are dropped.
// `server-only` makes the BUILD FAIL if a Client Component ever imports this
// file, so the DB code can never leak into the browser bundle.
import 'server-only';
import { cache } from 'react';
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
async function findSummaries(where: { authorId?: string; tag?: string } = {}): Promise<PostSummary[]> {
  const [posts, authors] = await Promise.all([
    db.posts.findMany({ ...where, status: 'published' }),
    db.authors.findMany(),
  ]);
  return posts.map((post) => toSummary(post, authors)).sort(byNewest);
}

export const getPublishedPosts = cache(async (): Promise<PostSummary[]> => findSummaries());

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  return findSummaries({ tag });
}

export async function getPostsByAuthor(authorId: string): Promise<PostSummary[]> {
  return findSummaries({ authorId });
}

export async function getAllTags(): Promise<string[]> {
  const posts = await db.posts.findMany({ status: 'published' });
  return [...new Set(posts.flatMap((post) => post.tags))].sort();
}

// 📘 React.cache MEMOIZES this function for the duration of ONE request.
// The post page calls getPostBySlug() in two different components
// (<PostContent> and <RelatedPosts>), and on Day 5 generateMetadata will call it too.
// Without cache() that's multiple DB queries. With it, it's exactly one.
// Check the terminal: you'll see a single `posts.findBySlug` per page load.
// (fetch() requests get this deduplication automatically. DB calls need cache().)
export const getPostBySlug = cache(async (slug: string): Promise<PostDetail | null> => {
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
});
