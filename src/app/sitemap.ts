// 📘 Day 6: this file becomes /sitemap.xml, the list of every page you WANT
// Google to know about. Google still finds pages by following links, but the
// sitemap makes sure none are missed, and `lastModified` tells it which pages
// changed since its last visit.
//
// It reads the same cached DAL functions as the pages, so:
//   - drafts are never listed (the DAL hides them)
//   - a new post shows up here automatically
//   - it's built once at build time, with no extra DB queries per request
import type { MetadataRoute } from 'next';
import { getAuthors } from '@/data/authors';
import { getPublishedPosts } from '@/data/posts';
import { absoluteUrl, minPostsForTagPage } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, authors] = await Promise.all([getPublishedPosts(), getAuthors()]);
  const newestPostDate = posts[0]?.publishedAt; // posts are sorted newest first

  // Count posts per tag, to leave out the thin tag pages that have `noindex`.
  const postsPerTag = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) postsPerTag.set(tag, (postsPerTag.get(tag) ?? 0) + 1);
  }
  const indexedTags = [...postsPerTag].filter(([, count]) => count >= minPostsForTagPage).map(([tag]) => tag);

  // 📘 Only `url` and `lastModified` matter to Google. It ignores the
  // `changeFrequency` and `priority` fields, so we don't set them.
  return [
    { url: absoluteUrl('/'), lastModified: newestPostDate },
    { url: absoluteUrl('/posts'), lastModified: newestPostDate },
    { url: absoluteUrl('/authors') },
    { url: absoluteUrl('/about') },
    ...posts.map((post) => ({ url: absoluteUrl(`/posts/${post.slug}`), lastModified: post.publishedAt })),
    ...authors.map((author) => ({ url: absoluteUrl(`/authors/${author.id}`) })),
    ...indexedTags.map((tag) => ({ url: absoluteUrl(`/tags/${tag}`) })),
  ];
}
