// 📘 Day 7: the comment section. A Server Component reads the saved comments
// (cached, tag `comments:<slug>`), and the Client Component <CommentForm> writes.
//
// After a successful comment, the action calls updateTag(`comments:<slug>`).
// The action's response then includes this component re-rendered with the new
// comment. The form never has to "add" the comment to the list itself.
import { CommentForm } from '@/components/comment-form';
import { getComments } from '@/data/comments';
import { formatDate } from '@/lib/format';

// 📘 Day 9: the Delete buttons moved to /dashboard. This page is the same for
// every visitor (it's made at build time), so it can't know whether the viewer
// is the post's author. Showing "Delete" to everyone, only to fail for most,
// would be confusing.
export async function Comments({ slug }: { slug: string }) {
  const comments = await getComments(slug);

  return (
    <section className="space-y-6 border-t border-foreground/10 pt-8">
      <h2 className="text-xl font-semibold">
        Comments <span className="text-foreground/50">({comments.length})</span>
      </h2>

      <CommentForm slug={slug} />

      {comments.length === 0 ? (
        <p className="text-sm text-foreground/50">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-foreground/10 p-4">
              <p className="text-sm">
                <span className="font-medium">{comment.name}</span>
                <span className="text-foreground/50"> · {formatDate(comment.createdAt)}</span>
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/80">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
