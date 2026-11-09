import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db, type AuthorRow } from '@/lib/db';

// 📘 The public shape of an author. Note: no `email`.
// TypeScript makes the DTO explicit. If someone adds `email` to the UI,
// they have to change this type first, which is a visible, reviewable decision.
export type Author = Pick<AuthorRow, 'id' | 'name' | 'bio' | 'role' | 'joinedAt'>;

function toAuthor({ id, name, bio, role, joinedAt }: AuthorRow): Author {
  return { id, name, bio, role, joinedAt };
}

// 📘 Day 3: author profiles change rarely, so they use the built-in 'days' profile.
export async function getAuthors(): Promise<Author[]> {
  'use cache';
  cacheLife('days');
  // 📘 Tag = what the result is built FROM. This list only reads authors, so a
  // post edit (updateTag('posts')) has no reason to throw it away.
  cacheTag('authors');
  const authors = await db.authors.findMany();
  return authors.map(toAuthor);
}

export async function getAuthor(id: string): Promise<Author | null> {
  'use cache';
  cacheLife('days');
  cacheTag('authors', `author:${id}`);
  const author = await db.authors.findById(id);
  return author ? toAuthor(author) : null;
}
