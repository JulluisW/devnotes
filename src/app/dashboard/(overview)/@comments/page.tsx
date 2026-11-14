// 📘 Day 10: the @comments SLOT (it was a section of the dashboard page on Day 9).
// Arrives in the layout as the `comments` prop.
import { deleteCommentAction } from '@/app/posts/[slug]/actions';
import { DeleteButton } from '@/components/delete-button';
import { getMyDashboard } from '@/data/dashboard';
import { formatDate } from '@/lib/format';

export default async function CommentsSlot() {
  const { comments } = await getMyDashboard(); // same request as the other slots → no 2nd DB query

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Comments on your posts</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-foreground/50">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            // 📘 Day 7 homework #4: fades while its DeleteButton is pending.
            <li
              key={comment.id}
              className="rounded-lg border border-foreground/10 p-4 transition-opacity has-data-pending:opacity-30"
            >
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
  );
}
