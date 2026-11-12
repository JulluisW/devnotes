// 📘 Day 7: the DAL for comments. Same rules as src/data/posts.ts:
// pages never touch `db`, and they only get the fields they need (a DTO).
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db';

export type Comment = {
  id: number;
  name: string;
  body: string;
  createdAt: string;
};

// 📘 Tagged `comments:<slug>`, and nothing else. A new comment on one post
// expires only that post's comment list. The article itself stays cached.
export async function getComments(slug: string): Promise<Comment[]> {
  'use cache';
  cacheLife('blog');
  cacheTag(`comments:${slug}`);
  const rows = await db.comments.findByPost(slug);
  return rows.map(({ id, name, body, createdAt }) => ({ id, name, body, createdAt }));
}

// 📘 A write. Returns false when the post isn't public (missing or draft),
// so nobody can attach comments to a draft by sending a POST by hand.
export async function createComment(slug: string, input: { name: string; body: string }): Promise<boolean> {
  const post = await db.posts.findBySlug(slug);
  if (!post || post.status !== 'published') return false;
  await db.comments.create({ postSlug: slug, name: input.name, body: input.body });
  return true;
}

// 📘 Day 7 homework #4. Only deletes the comment if it belongs to THIS post,
// so a POST with a mismatched slug + id can't delete a comment on another post.
export async function deleteComment(postSlug: string, id: number): Promise<boolean> {
  const comments = await db.comments.findByPost(postSlug);
  if (!comments.some((c) => c.id === id)) return false;
  await db.comments.delete(id);
  return true;
}
