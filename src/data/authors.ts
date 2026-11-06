import 'server-only';
import { cache } from 'react';
import { db, type AuthorRow } from '@/lib/db';

// 📘 The public shape of an author. Note: no `email`.
// TypeScript makes the DTO explicit. If someone adds `email` to the UI,
// they have to change this type first, which is a visible, reviewable decision.
export type Author = Pick<AuthorRow, 'id' | 'name' | 'bio' | 'role' | 'joinedAt'>;

function toAuthor({ id, name, bio, role, joinedAt }: AuthorRow): Author {
  return { id, name, bio, role, joinedAt };
}

export async function getAuthors(): Promise<Author[]> {
  const authors = await db.authors.findMany();
  return authors.map(toAuthor);
}

export const getAuthor = cache(async (id: string): Promise<Author | null> => {
  const author = await db.authors.findById(id);
  return author ? toAuthor(author) : null;
});
