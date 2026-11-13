// 📘 Day 9: SESSIONS. How the server remembers "this browser is Maya".
//
// HTTP has no memory: every request arrives alone. A COOKIE is a small value
// the server asks the browser to store and send back with EVERY request to
// this site. So at login we:
//   1. create a session row on the server: { id: <random>, userId: 'maya' }
//   2. send the browser a cookie: devnotes_session=<that random id>
// On every later request the browser sends the cookie, we look the id up, and
// we know who it is. The cookie is only a random "ticket number". It doesn't
// contain the user id, and it can't be guessed (32 random bytes).
//
// Only Server Actions, Route Handlers and proxy.ts can SET cookies. A page can
// only READ them (a page is already streaming when it runs).
import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

// 📘 proxy.ts checks for a cookie with this exact name, so it's exported.
export const SESSION_COOKIE = 'devnotes_session';
const SESSION_DAYS = 7;

export async function createSession(userId: string): Promise<void> {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.sessions.create({ id, userId, expiresAt: expiresAt.toISOString() });

  (await cookies()).set(SESSION_COOKIE, id, {
    httpOnly: true, // JavaScript in the page can't read it (document.cookie), so an XSS bug can't steal it
    secure: process.env.NODE_ENV === 'production', // only sent over https (browsers allow http://localhost)
    sameSite: 'lax', // not sent with POSTs from OTHER sites (CSRF protection)
    path: '/', // sent with every URL on this site
    expires: expiresAt, // the browser deletes it after 7 days
  });
}

// Returns the user id of the current visitor, or null. Read-only: it never
// sets or deletes cookies, so it's safe to call while rendering a page.
export async function readSessionUserId(): Promise<string | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await db.sessions.findById(id);
  // A cookie we don't know (logged out, server restarted, made up) or an
  // expired session both mean "not logged in".
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session.userId;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) await db.sessions.delete(id); // the server forgets the ticket...
  cookieStore.delete(SESSION_COOKIE); // ...and the browser throws it away
}
