// 📘 Day 9: the author dashboard's data. Everything here is PRIVATE to the
// logged-in author, so:
//   - it starts with requireUser(): no user, no data (even if a page forgets to check)
//   - it takes NO userId argument. The user comes from the session, never from
//     the caller, so nobody can ask for someone else's dashboard.
//   - no 'use cache': this data is per user, and 'use cache' is shared by everyone.
import 'server-only';
import { cache } from 'react';
import { chaos } from '@/lib/chaos';
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

// 📘 Day 10: the dashboard is now split into 3 parallel slots (page, @stats,
// @comments), and each one calls getMyDashboard(). React.cache makes the 3 calls
// share ONE result per request, so the DB still runs once (check the [db] logs).
export const getMyDashboard = cache(async (): Promise<{ posts: DashboardPost[]; comments: DashboardComment[] }> => {
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
});

export type DashboardStats = { published: number; drafts: number; likes: number; comments: number };

// 📘 Day 10: the numbers for the @stats slot. The chaos switch lets you break ONLY
// this slot (set chaos.dashboardStats = 1) and watch @stats/error.tsx catch it
// while the posts list and the comments keep working.
export async function getMyStats(): Promise<DashboardStats> {
  const { posts, comments } = await getMyDashboard();
  if (Math.random() < chaos.dashboardStats) throw new Error('Stats failed (chaos.dashboardStats)');
  return {
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    likes: posts.reduce((sum, p) => sum + p.likes, 0),
    comments: comments.length,
  };
}
