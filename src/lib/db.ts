// 📘 Day 2: A FAKE database. It behaves like a real one in the two ways that
// matter for learning:
//   1. Every query is async and takes time (simulated network latency).
//   2. Rows contain private columns (emails, drafts, internal notes) that
//      must never reach the browser.
// Swap this file for Prisma/Drizzle/Postgres later and nothing else changes,
// because only the Data Access Layer (src/data) is allowed to import it.
import 'server-only';
import { chaos } from './chaos';
import { hashPassword } from './password';

export type AuthorRow = {
  id: string;
  name: string;
  email: string; // 🔒 private
  passwordHash: string; // 🔒 private (Day 9). Never leaves the DAL.
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
  // 📘 Day 11: a picture in public/covers/. Its real size is 1600×900 (see next/image).
  cover: string;
  authorId: string;
  publishedAt: string;
  tags: string[];
  likes: number;
  status: 'published' | 'draft';
  internalNotes: string; // 🔒 private
  // 📘 Day 4: old URLs of this post. When a slug is renamed, the old one goes here
  // so old links (from Google, Twitter, other blogs) can be redirected, not broken.
  previousSlugs: string[];
};

// 📘 Day 7: a new table. Each row points at a post by slug.
export type CommentRow = {
  id: number;
  postSlug: string;
  name: string;
  body: string;
  createdAt: string; // ISO date + time
};

// 📘 Day 9: demo logins. All three authors use the password below.
// Log in at /login with maya@devnotes.internal, rafael@devnotes.internal or
// sora@devnotes.internal. (A real app never has a password in the code. Users
// choose their own at sign-up, and only the hash is saved.)
export const DEMO_PASSWORD = 'devnotes-demo';
const demoHash = hashPassword(DEMO_PASSWORD);

// 📘 Day 9: a login session. The browser's cookie holds only `id`, a long
// random string. Everything else stays here on the server.
export type SessionRow = {
  id: string;
  userId: string; // an author id
  expiresAt: string; // ISO date + time
};

const seedAuthors: AuthorRow[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    email: 'maya@devnotes.internal',
    passwordHash: demoHash,
    bio: 'Writes about React internals and the server/client boundary.',
    role: 'Staff Engineer',
    joinedAt: '2025-03-12',
  },
  {
    id: 'rafael',
    name: 'Rafael Ortiz',
    email: 'rafael@devnotes.internal',
    passwordHash: demoHash,
    bio: 'Routing nerd. Believes every URL deserves a good layout.',
    role: 'Frontend Lead',
    joinedAt: '2025-07-01',
  },
  {
    id: 'sora',
    name: 'Sora Tanaka',
    email: 'sora@devnotes.internal',
    passwordHash: demoHash,
    bio: 'TypeScript enthusiast who turns runtime bugs into compile errors.',
    role: 'Senior Engineer',
    joinedAt: '2026-01-20',
  },
];

const seedPosts: PostRow[] = [
  {
    id: 1,
    slug: 'why-server-components',
    cover: '/covers/why-server-components.jpg',
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
    previousSlugs: ['server-components-101'], // 📘 Day 4: renamed. The old URL must 308 here.
  },
  {
    id: 2,
    slug: 'file-based-routing',
    cover: '/covers/file-based-routing.jpg',
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
    previousSlugs: [],
  },
  {
    id: 3,
    slug: 'layouts-that-persist',
    cover: '/covers/layouts-that-persist.jpg',
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
    previousSlugs: [],
  },
  {
    id: 4,
    slug: 'typescript-with-nextjs',
    cover: '/covers/typescript-with-nextjs.jpg',
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
    previousSlugs: [],
  },
  {
    id: 5,
    slug: 'data-access-layer',
    cover: '/covers/data-access-layer.jpg',
    title: 'Designing a Data Access Layer',
    excerpt: 'Keep your database behind a small, server-only module that returns safe DTOs.',
    content: `This post is still being written.`,
    authorId: 'maya',
    publishedAt: '2026-11-10',
    tags: ['security', 'architecture'],
    likes: 0,
    status: 'draft', // 📘 must never appear on the public site
    internalNotes: 'Waiting for legal review.',
    previousSlugs: [],
  },
];

const seedComments: CommentRow[] = [
  {
    id: 1,
    postSlug: 'why-server-components',
    name: 'Rafael',
    body: 'The "zero JS for server parts" point finally clicked for me.',
    createdAt: '2026-10-29T09:15:00.000Z',
  },
  {
    id: 2,
    postSlug: 'why-server-components',
    name: 'Sora',
    body: 'Would love a follow-up on passing props across the boundary.',
    createdAt: '2026-10-30T14:02:00.000Z',
  },
];

// 📘 Day 7: the data lives in these arrays, in the server's memory. Writes survive
// while the server process runs, and reset when you restart `npm run dev` or
// `npm run start`. A real database would keep them.
//
// 📘 Day 8: ONE copy for the whole server, kept on `globalThis`.
// Next.js bundles route handlers (app/**/route.ts) separately from pages, and
// each bundle runs its own copy of this file. With plain `const posts = [...]`,
// the CMS webhook (a route handler) changed ITS copy of the posts, and the pages
// kept reading THEIR copy with the old title (measured). globalThis is shared by
// everything in the server process, so now there's one copy.
// A real database doesn't have this problem: it's a separate server everyone talks to.
type Store = { authors: AuthorRow[]; posts: PostRow[]; comments: CommentRow[]; sessions: SessionRow[] };
const globalStore = globalThis as typeof globalThis & { __devnotesDb?: Store };
globalStore.__devnotesDb ??= { authors: seedAuthors, posts: seedPosts, comments: seedComments, sessions: [] };
const { authors, posts, comments, sessions } = globalStore.__devnotesDb;
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 📘 Every query goes through this helper. It logs when a query starts (→) and
// ends (←) in your TERMINAL, so you can see sequential vs parallel fetching
// and React.cache deduplication with your own eyes.
//
// 📘 Day 4: `failureRate` (from src/lib/chaos.ts) makes a query throw, like a real
// DB timing out. A thrown error travels up to the nearest error boundary.
async function query<T>(label: string, latencyMs: number, run: () => T, failureRate = 0): Promise<T> {
  const startedAt = performance.now();
  console.log(`[db] → ${label}`);
  await sleep(latencyMs);
  if (Math.random() < failureRate) {
    console.log(`[db] ✗ ${label} failed: connection timeout`);
    throw new Error(`DB query failed: ${label} (connection timeout)`);
  }
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
      query(
        `posts.findBySlug("${slug}")`,
        400,
        () => posts.find((post) => post.slug === slug) ?? null,
        chaos.postBySlug,
      ),
    findByPreviousSlug: (slug: string) =>
      query(
        `posts.findByPreviousSlug("${slug}")`,
        300,
        () => posts.find((post) => post.previousSlugs.includes(slug)) ?? null,
      ),
    // 📘 Day 8: used by the CMS webhook (app/api/webhooks/cms/route.ts) when an
    // editor changes a post's title or excerpt in the "CMS".
    update: (slug: string, data: Partial<Pick<PostRow, 'title' | 'excerpt'>>) =>
      query(`posts.update("${slug}", ${JSON.stringify(Object.keys(data))})`, 400, () => {
        const post = posts.find((p) => p.slug === slug);
        if (!post) return null;
        Object.assign(post, data);
        return post;
      }),
    // 📘 Day 7: our first WRITE. Watch the terminal: writes log [db] → / ← too.
    // Returns the new count, or null if there's no such post.
    incrementLikes: (slug: string) =>
      query(`posts.incrementLikes("${slug}")`, 300, () => {
        const post = posts.find((p) => p.slug === slug);
        if (!post) return null;
        post.likes += 1;
        return post.likes;
      }),
  },
  comments: {
    // 📘 Day 9: all comments on a list of posts (the author dashboard).
    findByPosts: (postSlugs: string[]) =>
      query(`comments.findByPosts(${postSlugs.length} posts)`, 350, () =>
        comments.filter((c) => postSlugs.includes(c.postSlug)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    findByPost: (postSlug: string) =>
      query(`comments.findByPost("${postSlug}")`, 350, () =>
        comments.filter((c) => c.postSlug === postSlug).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    create: (data: Pick<CommentRow, 'postSlug' | 'name' | 'body'>) =>
      query(`comments.create(${JSON.stringify({ postSlug: data.postSlug, name: data.name })})`, 500, () => {
        const row: CommentRow = {
          id: Math.max(0, ...comments.map((c) => c.id)) + 1,
          createdAt: new Date().toISOString(),
          ...data,
        };
        comments.push(row);
        return row;
      }),

    // 📘 Day 7 homework #4. Arrow function WITHOUT braces, so it RETURNS the
    // promise from query(). With `=> { query(...) }` nothing was returned, so
    // `await db.comments.delete(id)` didn't wait, and the page re-render could
    // read the comments before the delete had finished.
    delete: (id: number) =>
      query(`comments.delete(${id})`, 500, () => {
        const index = comments.findIndex((c) => c.id === id);
        if (index !== -1) comments.splice(index, 1);
      }),
  },
  authors: {
    findMany: () => query('authors.findMany()', 300, () => authors),
    findById: (id: string) =>
      query(`authors.findById("${id}")`, 500, () => authors.find((author) => author.id === id) ?? null),
    // 📘 Day 9: for login. Emails are compared in lowercase.
    findByEmail: (email: string) =>
      query('authors.findByEmail(…)', 300, () => authors.find((a) => a.email === email.toLowerCase()) ?? null),
  },
  // 📘 Day 9: the sessions table. Logging out deletes the row, so a stolen
  // cookie stops working right away (the server no longer knows that id).
  sessions: {
    create: (row: SessionRow) =>
      query('sessions.create(…)', 100, () => {
        sessions.push(row);
        return row;
      }),
    findById: (id: string) => query('sessions.findById(…)', 100, () => sessions.find((s) => s.id === id) ?? null),
    delete: (id: string) =>
      query('sessions.delete(…)', 100, () => {
        const index = sessions.findIndex((s) => s.id === id);
        if (index !== -1) sessions.splice(index, 1);
      }),
  },
};
