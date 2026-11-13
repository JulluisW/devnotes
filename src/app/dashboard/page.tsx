// 📘 Day 9: a PRIVATE page. Its content depends on WHO is asking, so:
//   - it can't be made at build time (there's no visitor at build time)
//   - with Cache Components, anything that reads cookies must sit inside
//     <Suspense>. Without it, `next build` fails.
// The heading and the boundary's fallback are the static shell (instant),
// and <Dashboard> streams in per request. The build table shows ◐.
//
// 📘 Three layers protect this page (Day 9 "defense in depth"):
//   1. proxy.ts: no session cookie at all → redirect to /login before rendering
//   2. getMyDashboard() → requireUser(): cookie present but invalid/expired → /login
//   3. the DAL only returns THIS user's posts and comments
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { deleteCommentAction } from '@/app/posts/[slug]/actions';
import { logoutAction } from '@/app/login/actions';
import { DeleteButton } from '@/components/delete-button';
import { PostListSkeleton } from '@/components/skeletons';
import { getCurrentUser } from '@/data/auth';
import { getMyDashboard } from '@/data/dashboard';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false }, // private pages don't belong in Google
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <Suspense fallback={<PostListSkeleton count={2} />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const { posts, comments } = await getMyDashboard(); // redirects to /login if not logged in
  const user = await getCurrentUser(); // React.cache: no second session lookup

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-foreground/10 p-4">
        <p className="text-sm">
          Logged in as <span className="font-medium">{user?.name}</span>
        </p>
        {/* 📘 A Server Action straight on a form: works even without JavaScript. */}
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-foreground/60 hover:underline">
            Log out
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Your posts</h2>
        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
          {posts.map((post) => (
            <li key={post.slug} className="flex items-center justify-between gap-4 p-4 text-sm">
              {post.status === 'published' ? (
                <Link href={`/posts/${post.slug}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
              ) : (
                <span className="font-medium">
                  {post.title}{' '}
                  <span className="ml-1 rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs text-yellow-600">Draft</span>
                </span>
              )}
              <span className="shrink-0 text-foreground/50">
                ♥ {post.likes} · 💬 {post.commentCount}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Comments on your posts</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-foreground/50">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              // 📘 Day 7 homework #4: fades while its DeleteButton is pending.
              <li key={comment.id} className="rounded-lg border border-foreground/10 p-4 transition-opacity has-data-pending:opacity-30">
                <p className="text-sm">
                  <span className="font-medium">{comment.name}</span>
                  <span className="text-foreground/50">
                    {' '}
                    on “{comment.postTitle}” · {formatDate(comment.createdAt)}
                  </span>
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{comment.body}</p>
                <DeleteButton deleteAction={deleteCommentAction.bind(null, comment.postSlug, comment.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
