// 📘 Day 1: For now our "database" is a plain array in a module.
// Because it's synchronous and identical on every request, Next.js can
// prerender every page that uses it at build time (static HTML).
// On Day 2 we'll replace this with an async, DB-like data layer.

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string; // ISO 8601 date
  tags: string[];
  likes: number;
};

const posts: Post[] = [
  {
    slug: 'why-server-components',
    title: 'Why Server Components Changed Everything',
    excerpt:
      'Server Components let you fetch data and render UI on the server, shipping zero JavaScript for them to the browser.',
    content: `Before the App Router, every React component you wrote was shipped to the browser, even if it only rendered static text.

Server Components flip the default. They run only on the server, can be async, can talk to your database directly, and send just their rendered result to the client.

You opt into interactivity with the "use client" directive, only where you need state, effects, or browser APIs.`,
    author: 'Ada Lovelace',
    publishedAt: '2026-10-28',
    tags: ['react', 'server-components'],
    likes: 42,
  },
  {
    slug: 'file-based-routing',
    title: 'File-Based Routing in the App Router',
    excerpt: 'Folders define URL segments. Special files like page.tsx and layout.tsx define the UI for each segment.',
    content: `In the App Router, the folder structure inside app/ IS your URL structure.

A folder becomes a route segment. A page.tsx file makes that segment publicly reachable. A layout.tsx file wraps everything beneath it and persists across navigations.

Square brackets, like [slug], create dynamic segments whose value you read from the params prop.`,
    author: 'Grace Hopper',
    publishedAt: '2026-10-21',
    tags: ['routing', 'fundamentals'],
    likes: 31,
  },
  {
    slug: 'layouts-that-persist',
    title: 'Layouts That Persist',
    excerpt:
      "Layouts don't re-render on navigation. That means their state survives while the page inside them changes.",
    content: `When you navigate between two pages that share a layout, Next.js only re-renders the part of the tree that changed: the page.

The layout stays mounted. Any client state inside it, like an open menu, a scroll position, or text in an input, is preserved.

This is called partial rendering, and it's one of the reasons App Router navigations feel instant.`,
    author: 'Ada Lovelace',
    publishedAt: '2026-10-14',
    tags: ['routing', 'layouts'],
    likes: 18,
  },
  {
    slug: 'typescript-with-nextjs',
    title: 'Getting the Most Out of TypeScript in Next.js',
    excerpt:
      'Typed routes, generated PageProps/LayoutProps helpers, and strict mode catch bugs before they reach production.',
    content: `Next.js generates types from your actual route structure.

PageProps<'/posts/[slug]'> knows that params contains a slug. With typedRoutes enabled, a typo in a <Link href> becomes a compile error instead of a 404.

Combine that with strict mode and you get a codebase where refactors are safe.`,
    author: 'Linus Torvalds',
    publishedAt: '2026-10-07',
    tags: ['typescript', 'fundamentals'],
    likes: 27,
  },
];

export function getAllPosts(): Post[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
