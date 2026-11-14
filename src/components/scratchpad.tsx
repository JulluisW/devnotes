// 📘 Day 1: This lives in posts/layout.tsx. Type something, then click a
// different post. The text survives because layouts stay mounted across
// navigations (only the page segment re-renders). Compare that with the
// LikeButton inside the page, which resets for every post.
//
// 📘 Day 11: it now also survives a REFRESH, because it saves to localStorage.
// localStorage only exists in the browser. The server has no localStorage, so
// this component can't be rendered on the server at all. That's why it's loaded
// through next/dynamic with `ssr: false` (see scratchpad-lazy.tsx).
'use client';

import { useState } from 'react';

const STORAGE_KEY = 'devnotes-scratchpad';

function readSaved(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return ''; // private mode or storage blocked: start empty
  }
}

export function Scratchpad() {
  // Runs once, in the browser (never on the server, thanks to ssr: false).
  const [notes, setNotes] = useState(readSaved);

  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">Scratchpad (saved in this browser)</span>
      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          try {
            localStorage.setItem(STORAGE_KEY, event.target.value);
          } catch {
            // storage full or blocked: keep the text in memory only
          }
        }}
        rows={4}
        placeholder="Type here, then open another post, or refresh…"
        className="mt-2 w-full resize-none rounded-md border border-foreground/15 bg-transparent p-2 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}
