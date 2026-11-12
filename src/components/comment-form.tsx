// 📘 Day 7: a form that calls a Server Action and shows its result.
//
// useActionState(action, initialState) returns [state, formAction, pending]:
//   state      → what the action returned last time (errors, success message)
//   formAction → put this on <form action={...}>
//   pending    → true while the POST request is in flight
'use client';

import { useActionState } from 'react';
import { addCommentAction, type CommentFormState } from '@/app/posts/[slug]/actions';

const initialState: CommentFormState = { status: 'idle' };

const input =
  'w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 aria-invalid:border-red-500';

export function CommentForm({ slug }: { slug: string }) {
  // 📘 bind(null, slug) makes a new function with `slug` already filled in as the
  // first argument. React then adds prevState and formData after it.
  const [state, formAction, pending] = useActionState(addCommentAction.bind(null, slug), initialState);
  const errors = state.fieldErrors ?? {};

  return (
    // 📘 React EMPTIES a <form action> after every submit (it resets each input to
    // its defaultValue). After an error we want to keep what the user typed, so
    // the action sends it back in state.values and we use it as defaultValue.
    // After a success, state.values is empty, so the form resets to blank.
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="comment-name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="comment-name"
          name="name"
          defaultValue={state.values?.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'comment-name-error' : undefined}
          className={input}
        />
        {errors.name && (
          <p id="comment-name-error" className="mt-1 text-sm text-red-500">
            {errors.name[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment-body" className="mb-1 block text-sm font-medium">
          Comment
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={3}
          defaultValue={state.values?.body}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? 'comment-body-error' : undefined}
          className={input}
        />
        {errors.body && (
          <p id="comment-body-error" className="mt-1 text-sm text-red-500">
            {errors.body[0]}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? 'Posting…' : 'Post comment'}
        </button>
        {/* aria-live: screen readers announce the message when it changes */}
        <p aria-live="polite" className={state.status === 'error' ? 'text-sm text-red-500' : 'text-sm text-green-600'}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
