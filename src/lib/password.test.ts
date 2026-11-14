import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing (Day 9)', () => {
  it('accepts the right password and rejects a wrong one', () => {
    const stored = hashPassword('devnotes-demo');
    expect(verifyPassword('devnotes-demo', stored)).toBe(true);
    expect(verifyPassword('devnotes-dem0', stored)).toBe(false);
  });

  it('never stores the password itself, and salts every hash', () => {
    const a = hashPassword('devnotes-demo');
    const b = hashPassword('devnotes-demo');
    expect(a).not.toContain('devnotes-demo');
    expect(a).not.toBe(b); // same password, different random salt
  });
});
