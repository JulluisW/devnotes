// 📘 Day 9: passwords are NEVER stored as plain text. We store a HASH:
// a one-way scramble. You can turn "devnotes-demo" into the hash, but you
// can't turn the hash back into the password. At login we hash what the user
// typed and compare the two hashes.
//
// scrypt is built into Node (no package needed) and is slow ON PURPOSE:
// an attacker who steals the database has to spend real time per guess.
// The "salt" is random per password, so two users with the same password
// still get different hashes.
import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  // Constant-time comparison (same reason as the Day 8 webhook secret).
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}
