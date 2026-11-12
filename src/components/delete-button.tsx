// 📘 Day 7 homework #4: an optimistic delete (pattern from the Next.js docs,
// guides/interactive-apps.md, "Step 7: Signal pending deletion to a parent").
//
// Your question was: should the parent own useOptimistic? It can't here.
// useOptimistic is a hook, so it only works in a Client Component, and the
// parent (<Comments>) is a Server Component. Instead:
//   1. The parent PASSES THE ACTION down, already bound to this comment:
//      deleteAction={deleteCommentAction.bind(null, slug, comment.id)}
//   2. The button keeps a tiny optimistic boolean: "am I deleting right now?"
//   3. It shows that as an HTML attribute (data-pending). The parent <li> fades
//      itself with CSS (has-data-pending:opacity-30). No state is lifted.
//
// Timeline:
//   0 ms     click → setIsPending(true) → the comment fades to 30%
//   ~1.3 s   response with the re-rendered page: the comment is gone from the
//            list, so this button unmounts. Nothing to reset.
//   failure  the optimistic `true` is dropped, the comment un-fades.
'use client';

import { useOptimistic } from 'react';

export function DeleteButton({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [isPending, setIsPending] = useOptimistic(false);

  return (
    <form
      action={async () => {
        setIsPending(true);
        await deleteAction();
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        data-pending={isPending ? '' : undefined}
        className="mt-3 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
    </form>
  );
}
