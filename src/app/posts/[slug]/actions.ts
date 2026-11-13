// 📘 Day 7: SERVER ACTIONS.
// 'use server' at the top of the file = every exported function here can be
// called FROM THE BROWSER, but runs ON THE SERVER.
//
// What actually happens when the browser calls likePostAction('my-post'):
//   1. The browser sends a POST request to the current page's URL.
//      The request says "run action #abc123 with the argument 'my-post'".
//   2. The server runs this function.
//   3. The server sends back one response with the return value AND, if we
//      called updateTag(), a freshly rendered page. No second request.
//
// ⚠️ Because it's just a POST request, ANYONE can call it with ANY arguments
// (curl, a script, the browser console). So every action must:
//   - validate its inputs (zod below)
//   - check who is calling (comes on Day 9 with auth)
//   - receive an ID (the slug), never a whole object it trusts
'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/data/auth';
import { createComment, deleteComment } from '@/data/comments';
import { likePost } from '@/data/posts';

const slugSchema = z.string().min(1).max(100);

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export async function likePostAction(slug: string): Promise<void> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return;

  const likes = await likePost(parsed.data);
  if (likes === null) return; // no such public post: nothing changed, nothing to update

  // 📘 Tell the cache what is now outdated. Pick the SMALLEST set of tags that
  // covers every place the like count is shown:
  //   'post:<slug>' → getPostBySlug (this post's page shows the count)
  //   'trending'    → getTrendingPosts (the home sidebar shows counts too)
  // NOT 'posts': that tag is on every list (home, /posts, tags, authors), and
  // none of those lists show likes. Expiring them would cost DB queries for nothing.
  //
  // updateTag = "expire it NOW". The page re-render that ships with this
  // action's response waits for fresh data, so the user sees their own like.
  updateTag(`post:${parsed.data}`);
  updateTag('trending');
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

// 📘 Zod describes what valid input looks like. safeParse() checks the input
// against it and never throws: you get { success: true, data } or
// { success: false, error }. .trim() runs first, so "   " counts as empty.
const commentSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(40, 'Keep your name under 40 characters.'),
  body: z.string().trim().min(3, 'Write at least 3 characters.').max(500, 'Keep it under 500 characters.'),
});

// 📘 What the action returns. useActionState gives this object back to the form,
// so the form can show errors. It must be plain data (it travels to the browser).
export type CommentFormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: { name?: string[]; body?: string[] };
  // What the user typed, sent back on error so the form can refill the inputs
  // (React empties a form after its action finishes).
  values?: { name: string; body: string };
};

// 📘 With useActionState, the action gets TWO extra arguments in front:
//   prevState → what this action returned last time (or the initial state)
//   formData  → the form's fields
// `slug` comes first because the form uses addCommentAction.bind(null, slug).
export async function addCommentAction(
  slug: string,
  prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const values = {
    name: String(formData.get('name') ?? ''),
    body: String(formData.get('body') ?? ''),
  };

  const parsedSlug = slugSchema.safeParse(slug);
  const parsed = commentSchema.safeParse(values);
  if (!parsedSlug.success || !parsed.success) {
    return {
      status: 'error',
      message: 'Please fix the fields below.',
      fieldErrors: parsed.success ? {} : z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const saved = await createComment(parsedSlug.data, parsed.data);
  if (!saved) return { status: 'error', message: 'This post no longer accepts comments.', values };

  // 📘 Only this post's comment list is outdated. Not the article, not any list.
  updateTag(`comments:${parsedSlug.data}`);
  return { status: 'success', message: 'Thanks! Your comment is posted.' };
}

// 📘 Day 7 homework #4 (Luis), reviewed.
// The id stays a number the whole way: numbers survive the trip from the browser,
// so there's no need to turn it into a string and parse it back.
// zod still checks it, because a hand-made POST can send anything ("abc", -1, 1.5).
const deleteCommentSchema = z.object({
  slug: slugSchema,
  id: z.number().int().positive(),
});

export async function deleteCommentAction(slug: string, id: number): Promise<void> {
  const parsed = deleteCommentSchema.safeParse({ slug, id });
  if (!parsed.success) return;

  // 📘 Day 9: two checks, at two levels:
  //   1. here: logged in at all? If not → redirect to /login.
  //   2. in the DAL (deleteComment): is this user the post's author?
  // The button only appears on the author's dashboard, but that's just UI.
  // Anyone can still send this POST by hand, so the checks must be HERE.
  await requireUser();
  const result = await deleteComment(parsed.data.slug, parsed.data.id);
  if (result !== 'deleted') return;

  // 📘 The comment list is cached by getComments, under `comments:<slug>`.
  // (`post:<slug>` is the ARTICLE's tag: it would refetch the post, not the comments.)
  updateTag(`comments:${parsed.data.slug}`);
}
