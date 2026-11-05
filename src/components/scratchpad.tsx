// 📘 Day 1: This lives in posts/layout.tsx. Type something, then click a
// different post. The text survives because layouts stay mounted across
// navigations (only the page segment re-renders). Compare that with the
// LikeButton inside the page, which resets for every post.
"use client";

import { useState } from "react";

export function Scratchpad() {
  const [notes, setNotes] = useState("");

  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
        Scratchpad (layout state)
      </span>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={4}
        placeholder="Type here, then open another post…"
        className="mt-2 w-full resize-none rounded-md border border-foreground/15 bg-transparent p-2 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}
