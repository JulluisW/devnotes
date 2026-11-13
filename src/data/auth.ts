// 📘 Day 9: WHO IS ASKING? This is the Data Access Layer for users.
// Every "who's logged in" and "are they allowed" question goes through here,
// so the rules live in ONE place (same idea as Day 2's posts DAL).
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { readSessionUserId } from '@/lib/session';

// 📘 A DTO again: only what the UI needs. Never the email or the passwordHash.
export type CurrentUser = { id: string; name: string };

// 📘 React.cache (Day 2): a page may ask "who is it?" in 3 components, but the
// cookie + session lookup runs once per request.
// NOT 'use cache': that saves results ACROSS users. Saving "the current user"
// there would show Maya's dashboard to Rafael. (It also can't read cookies.)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await readSessionUserId();
  if (!userId) return null;
  const author = await db.authors.findById(userId);
  return author ? { id: author.id, name: author.name } : null;
});

// 📘 For pages and actions that need a logged-in user. Not logged in →
// redirect('/login'), which stops the function (it throws, like notFound()).
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

// Returns the author id when the email + password match, otherwise null.
export async function checkCredentials(email: string, password: string): Promise<string | null> {
  const author = await db.authors.findByEmail(email);
  if (!author) return null;
  return verifyPassword(password, author.passwordHash) ? author.id : null;
}
