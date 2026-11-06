// 📘 Day 2: A FAKE database. It behaves like a real one in the two ways that
// matter for learning:
//   1. Every query is async and takes time (simulated network latency).
//   2. Rows contain private columns (emails, drafts, internal notes) that
//      must never reach the browser.
// Swap this file for Prisma/Drizzle/Postgres later and nothing else changes,
// because only the Data Access Layer (src/data) is allowed to import it.
import 'server-only';

export type AuthorRow = {
  id: string;
  name: string;
  email: string; // 🔒 private
  bio: string;
  role: string;
  joinedAt: string;
};

export type PostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  publishedAt: string;
  tags: string[];
  likes: number;
  status: 'published' | 'draft';
  internalNotes: string; // 🔒 private
};

const authors: AuthorRow[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    email: 'maya@devnotes.internal',
    bio: 'Writes about React internals and the server/client boundary.',
    role: 'Staff Engineer',
    joinedAt: '2025-03-12',
  },
  {
    id: 'rafael',
    name: 'Rafael Ortiz',
    email: 'rafael@devnotes.internal',
    bio: 'Routing nerd. Believes every URL deserves a good layout.',
    role: 'Frontend Lead',
    joinedAt: '2025-07-01',
  },
  {
    id: 'sora',
    name: 'Sora Tanaka',
    email: 'sora@devnotes.internal',
    bio: 'TypeScript enthusiast who turns runtime bugs into compile errors.',
    role: 'Senior Engineer',
    joinedAt: '2026-01-20',
  },
];

const posts: PostRow[] = [
  {
    id: 1,
    slug: 'why-server-components',
    title: 'Why Server Components Changed Everything',
    excerpt:
      'Server Components let you fetch data and render UI on the server, shipping zero JavaScript for them to the browser.',
    content: `Before the App Router, every React component you wrote was shipped to the browser, even if it only rendered static text.

Server Components flip the default. They run only on the server, can be async, can talk to your database directly, and send just their rendered result to the client.

You opt into interactivity with the "use client" directive, only where you need state, effects, or browser APIs.`,
    authorId: 'maya',
    publishedAt: '2026-10-28',
    tags: ['react', 'server-components'],
    likes: 42,
    status: 'published',
    internalNotes: 'Promote on the newsletter.',
  },
  {
    id: 2,
    slug: 'file-based-routing',
    title: 'File-Based Routing in the App Router',
    excerpt: 'Folders define URL segments. Special files like page.tsx and layout.tsx define the UI for each segment.',
    content: `In the App Router, the folder structure inside app/ IS your URL structure.

A folder becomes a route segment. A page.tsx file makes that segment publicly reachable. A layout.tsx file wraps everything beneath it and persists across navigations.

Square brackets, like [slug], create dynamic segments whose value you read from the params prop.`,
    authorId: 'rafael',
    publishedAt: '2026-10-21',
    tags: ['routing', 'fundamentals'],
    likes: 31,
    status: 'published',
    internalNotes: '',
  },
  {
    id: 3,
    slug: 'layouts-that-persist',
    title: 'Layouts That Persist',
    excerpt:
      "Layouts don't re-render on navigation. That means their state survives while the page inside them changes.",
    content: `When you navigate between two pages that share a layout, Next.js only re-renders the part of the tree that changed: the page.

The layout stays mounted. Any client state inside it, like an open menu, a scroll position, or text in an input, is preserved.

This is called partial rendering, and it's one of the reasons App Router navigations feel instant.`,
    authorId: 'rafael',
    publishedAt: '2026-10-14',
    tags: ['routing', 'layouts'],
    likes: 18,
    status: 'published',
    internalNotes: 'Add an Activity follow-up post.',
  },
  {
    id: 4,
    slug: 'typescript-with-nextjs',
    title: 'Getting the Most Out of TypeScript in Next.js',
    excerpt:
      'Typed routes, generated PageProps/LayoutProps helpers, and strict mode catch bugs before they reach production.',
    content: `Next.js generates types from your actual route structure.

PageProps<'/posts/[slug]'> knows that params contains a slug. With typedRoutes enabled, a typo in a <Link href> becomes a compile error instead of a 404.

Combine that with strict mode and you get a codebase where refactors are safe.`,
    authorId: 'sora',
    publishedAt: '2026-10-07',
    tags: ['typescript', 'fundamentals'],
    likes: 27,
    status: 'published',
    internalNotes: '',
  },
  {
    id: 5,
    slug: 'data-access-layer',
    title: 'Designing a Data Access Layer',
    excerpt: 'Keep your database behind a small, server-only module that returns safe DTOs.',
    content: `This post is still being written.`,
    authorId: 'maya',
    publishedAt: '2026-11-10',
    tags: ['security', 'architecture'],
    likes: 0,
    status: 'draft', // 📘 must never appear on the public site
    internalNotes: 'Waiting for legal review.',
  },
];

// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 📘 Every query goes through this helper. It logs when a query starts (→) and
// ends (←) in your TERMINAL, so you can see sequential vs parallel fetching
// and React.cache deduplication with your own eyes.
async function query<T>(label: string, latencyMs: number, run: () => T): Promise<T> {
  const startedAt = performance.now();
  console.log(`[db] → ${label}`);
  await sleep(latencyMs);
  console.log(`[db] ← ${label} (${Math.round(performance.now() - startedAt)}ms)`);
  // structuredClone: like a real DB, callers get fresh objects, never our internal rows
  return structuredClone(run());
}

export const db = {
  posts: {
    findMany: (where?: { status?: PostRow['status']; authorId?: string; tag?: string }) =>
      query(`posts.findMany(${JSON.stringify(where ?? {})})`, 600, () =>
        posts.filter(
          (post) =>
            (!where?.status || post.status === where.status) &&
            (!where?.authorId || post.authorId === where.authorId) &&
            (!where?.tag || post.tags.includes(where.tag)),
        ),
      ),
    findBySlug: (slug: string) =>
      query(`posts.findBySlug("${slug}")`, 400, () => posts.find((post) => post.slug === slug) ?? null),
  },
  authors: {
    findMany: () => query('authors.findMany()', 300, () => authors),
    findById: (id: string) =>
      query(`authors.findById("${id}")`, 500, () => authors.find((author) => author.id === id) ?? null),
  },
};
