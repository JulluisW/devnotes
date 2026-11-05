// 📘 Day 1: A Client Component for interactivity (useState + onClick).
// It receives `initialLikes` from a Server Component. Props crossing the
// server → client boundary must be serializable (strings, numbers, plain
// objects, arrays, Dates, Promises...). Functions and class instances aren't.
// On Day 7 we'll persist likes with a Server Action. For now it's local state.
"use client";

import { useState } from "react";

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  function toggle() {
    setLiked((wasLiked) => !wasLiked);
    setLikes((count) => (liked ? count - 1 : count + 1));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-1.5 text-sm transition-colors hover:bg-foreground/5 aria-pressed:border-pink-500/40 aria-pressed:bg-pink-500/10"
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {likes} {likes === 1 ? "like" : "likes"}
    </button>
  );
}
