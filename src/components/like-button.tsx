// 📘 Day 1: A Client Component for interactivity. It receives the count from a
// Server Component. Props crossing the server → client boundary must be
// serializable (strings, numbers, plain objects, arrays, Dates, Promises...).
//
// 📘 Day 7: likes are now SAVED on the server.
//   - `likes` is the server's number. After each like, the action calls
//     updateTag(), the page re-renders on the server, and this prop arrives
//     with the new value. (That's why it's no longer called initialLikes.)
//   - useOptimistic shows +1 INSTANTLY, before the server answers.
//
// Timeline of one click:
//   0 ms    click → addOptimisticLike() → the button shows 43 (optimistic)
//   0 ms    POST request to the server starts (likePostAction)
//   ~700 ms response arrives with the re-rendered page: likes prop = 43
//           the optimistic value is dropped, the real 43 takes its place
// If the action fails, the optimistic value is simply dropped and the
// button goes back to the server's number. No manual "undo" code.
//
// No liked/unliked toggle anymore: without logins (Day 9) the server can't know
// WHO liked, so every click adds one like.
'use client';

import { useOptimistic } from 'react';
import { likePostAction } from '@/app/posts/[slug]/actions';

export function LikeButton({ slug, likes }: { slug: string; likes: number }) {
  // 📘 useOptimistic(serverValue, update):
  //   - with nothing pending, optimisticLikes === likes (the server's number)
  //   - while an action is pending, it's whatever `update` produced
  const [optimisticLikes, addOptimisticLike] = useOptimistic(likes, (current: number) => current + 1);

  return (
    // 📘 <form action={fn}> runs fn inside a "transition": React tracks it as
    // pending work, which is what useOptimistic needs.
    <form
      action={async () => {
        addOptimisticLike(undefined);
        await likePostAction(slug);
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-1.5 text-sm transition-colors hover:bg-pink-500/20"
      >
        <span aria-hidden>♥</span>
        {optimisticLikes} {optimisticLikes === 1 ? 'like' : 'likes'}
      </button>
    </form>
  );
}
