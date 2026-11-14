// 📘 Day 10: the modal FRAME (a Client Component), kept separate from the modal
// CONTENT (Server Components passed as children). Same idea as Day 1: keep
// 'use client' small and at the edges.
//
// It uses the browser's own <dialog> element: showModal() puts it on top of
// everything, dims the page behind it (the ::backdrop) and traps focus.
//
// ONE rule: the modal closes by going BACK in history (router.back()). ✕, Esc
// and a click outside all do that. Going back makes the URL /search?… again, and
// Next.js swaps the @modal slot back to its default (nothing).
//
// ⚠️ Trap we hit (measured): Next.js 16 doesn't throw away the page you leave. It
// keeps it hidden, so Back/Forward are instant. Our first version only opened the
// dialog once. After Back then Forward, the preview came back as a plain box at
// the bottom of the page, with no dimmed background. The fix: the effect's CLEANUP
// closes the dialog when the route is hidden, and the effect opens it again when
// the route is shown.
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal(); // route shown → open as a real modal
    return () => dialog.close(); // route hidden (Back) → close the dialog element
  }, []);

  return (
    <dialog
      ref={dialogRef}
      // Esc fires "cancel". Stop the browser from closing the dialog by itself,
      // and go back instead (the cleanup above then closes it).
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
      // A click on the dim area outside the box lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === dialogRef.current) router.back();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-foreground/10 bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="relative p-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close preview"
          className="absolute top-3 right-3 rounded-md px-2 py-1 text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
        >
          ✕
        </button>
        {children}
      </div>
    </dialog>
  );
}
