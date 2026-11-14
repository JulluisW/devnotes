// 📘 Day 12: the Day 10 URL cleaner. Every row in the lesson's table becomes a test,
// so a future change can't silently break one of them.
import { describe, expect, it } from 'vitest';
import { parseSearchParams, searchHref } from './search-params';

describe('parseSearchParams', () => {
  it('uses page 1 when page is missing, not a number, zero or negative', () => {
    expect(parseSearchParams({}).page).toBe(1);
    expect(parseSearchParams({ page: 'abc' }).page).toBe(1);
    expect(parseSearchParams({ page: '0' }).page).toBe(1);
    expect(parseSearchParams({ page: '-3' }).page).toBe(1);
    expect(parseSearchParams({ page: '2.5' }).page).toBe(1);
  });

  it('keeps a valid page number', () => {
    expect(parseSearchParams({ page: '2' }).page).toBe(2);
  });

  it('cleans the query: trims, lowercases, takes the first of ?q=a&q=b', () => {
    expect(parseSearchParams({ q: '  Routing ' }).q).toBe('routing');
    expect(parseSearchParams({ q: ['TypeScript', 'react'] }).q).toBe('typescript');
    expect(parseSearchParams({}).q).toBe('');
  });

  it('cuts very long queries to 50 characters', () => {
    expect(parseSearchParams({ q: 'x'.repeat(500) }).q).toHaveLength(50);
  });
});

describe('searchHref', () => {
  it('leaves out the defaults', () => {
    expect(searchHref('')).toBe('/search');
    expect(searchHref('routing')).toBe('/search?q=routing');
    expect(searchHref('', 2)).toBe('/search?page=2');
  });

  it('encodes special characters', () => {
    expect(searchHref('a&b c', 3)).toBe('/search?q=a%26b+c&page=3');
  });
});
