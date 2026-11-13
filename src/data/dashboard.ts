// 📘 Day 9: the author dashboard's data. Everything here is PRIVATE to the
// logged-in author, so:
//   - it starts with requireUser(): no user, no data (even if a page forgets to check)
//   - it takes NO userId argument. The user comes from the session, never from
//     the caller, so nobody can ask for someone else's dashboard.
//   - no 'use cache': this data is per user, and 'use cache' is shared by everyone.
import 'server-only';
import { db } from '@/lib/db';
import { requireUser } from './auth';

export type DashboardPost = {
  slug: string;
  title: string;
  status: 'published' | 'draft';
  likes: number;
  commentCount: number;
};

export type DashboardComment = {
  id: number;
  postSlug: string;
  postTitle: string;
  name: string;
  body: string;
  createdAt: string;
};

export async function getMyDashboard(): Promise<{ posts: DashboardPost[]; comments: DashboardComment[] }> {
  const user = await requireUser();

  // 📘 No status filter: authors see their OWN drafts here. Drafts stay hidden
  // everywhere else, because the public DAL (src/data/posts.ts) still filters them.
  const rows = await db.posts.findMany({ authorId: user.id });
  const comments = await db.comments.findByPosts(rows.map((p) => p.slug));
  const titleOf = (slug: string) => rows.find((p) => p.slug === slug)?.title ?? slug;

  return {
    posts: rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      status: p.status,
      likes: p.likes,
      commentCount: comments.filter((c) => c.postSlug === p.slug).length,
    })),
    comments: comments.map((c) => ({ ...c, postTitle: titleOf(c.postSlug) })),
  };
}
