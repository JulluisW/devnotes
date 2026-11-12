# Day 7: Mutations (saving data from the browser)

**In one sentence:** Days 1–6 only **read** data. Day 7 lets visitors **write** it (likes and comments), and then tells the cache exactly which saved copies are now out of date.

Branch: `day-07-mutations` (from `day-06-seo-crawlers`).

> ⚠️ **Restart `npm run dev` first.** We installed `zod` while your dev server was running, and it got stuck reloading the page in a loop. A fresh start fixes it.
>
> 💾 The fake DB keeps data **in the server's memory**. Likes and comments survive while the server runs, and reset to the original numbers when you restart it.

---

## ⭐ Must know (4 things)

| # | What | Where in DevNotes | One-line job |
|---|---|---|---|
| 1 | Server Action | `app/posts/[slug]/actions.ts` | a server function the browser can call |
| 2 | `updateTag` | inside each action | "these cached copies are out of date, refetch them now" |
| 3 | `useActionState` | `components/comment-form.tsx` | pending state + error messages for a form |
| 4 | `useOptimistic` | `components/like-button.tsx` | show the change instantly, before the server answers |

Everything after the "Details" heading is **OK to skip for now**.

What's new in the app:
- The ♥ button now **saves** the like. Reload the page and the number stays.
- Each post has a **comment section** with a form, validation errors and a list.

---

## 1. Server Action: a function the browser can call

- **What it does:** you write a normal async function on the server. A Client Component imports it and calls it like any function. Next.js turns the call into a **POST request** for you. No `fetch`, no API route, no URL to invent.
- **You write** (`src/app/posts/[slug]/actions.ts`, shortened):
  ```ts
  'use server'; // top of the file: every export here is a Server Action

  export async function likePostAction(slug: string) {
    const likes = await likePost(slug); // DAL write: +1 in the DB
    if (likes === null) return;         // no such public post
    updateTag(`post:${slug}`);          // see section 2
    updateTag('trending');
  }
  ```
  ```tsx
  // src/components/like-button.tsx ('use client')
  <form action={async () => { await likePostAction(slug); }}>
    <button type="submit">♥ {likes} likes</button>
  </form>
  ```
- **What happens when you click** (measured in dev, `/posts/file-based-routing`):

  | Time | Browser | Server |
  |---|---|---|
  | 0 ms | click → sends `POST /posts/file-based-routing` ("run likePostAction with `'file-based-routing'`") | |
  | | | runs `likePostAction`: `findBySlug` → `incrementLikes` (708 ms) |
  | | | `updateTag` was called → re-renders the page with fresh data |
  | ~1.2 s | **one** response arrives: the return value **and** the new page. The button shows the new count | |

  Your terminal shows it too:
  ```
  POST /posts/file-based-routing 200 in 1162ms
    └─ ƒ likePostAction("file-based-routing") in 708ms
  ```
- **⚠️ The important part: anyone can call it.** It's just a POST request. Someone can send it from `curl` or the browser console, with **any** argument, without ever clicking your button. So inside **every** action:
  - **validate the input.** We use zod (section 3).
  - **check who's calling.** We have no logins yet, so anyone can like or comment. Day 9 adds this check.
  - **take an ID, not a whole object.** `likePostAction(slug)` gets just the slug, and the DAL looks the post up itself. Never trust a `{ slug, likes: 9999 }` object sent from the browser.
- **The DAL does the write.** Same rule as Day 2: pages and actions never touch `db` directly. `likePost()` in `src/data/posts.ts` checks that the post is published, so nobody can like a draft by sending a POST by hand.
- **Use it:** for any change the user makes: like, comment, save settings, create, delete.
- **Avoid:** using it to **read** data. Reads belong in Server Components (Days 2–3). Actions run one at a time (see Details), so using them for reads makes pages slow.

## 2. After a write: tell the cache what changed

Day 3 saved query results with `'use cache'` and labeled them with `cacheTag`. After a write, those saved copies still hold the **old** numbers. You have to say which ones are now wrong.

- **What `updateTag` does:** deletes every saved copy with that label **right now**. The next read waits for the DB and gets fresh data. Because the action called it, Next.js also re-renders the current page inside the same response, so **the user sees their own change immediately**.
- **Which tags? The smallest set that covers every place showing the changed data.** For a like:

  | Where the like count is shown | Cached function | Its tags |
  |---|---|---|
  | the post page | `getPostBySlug` | `posts`, **`post:<slug>`** |
  | the home page "Trending" sidebar | `getTrendingPosts` | `posts`, **`trending`** |

  So the action calls `updateTag('post:<slug>')` and `updateTag('trending')`.

  **Not `updateTag('posts')`.** That label is on every post list (home, `/posts`, tags, authors). None of those lists show likes, so expiring them would only cost DB queries for nothing. This is the payoff of the precise tags from Day 3.
- **Measured on a production build:** 10 likes on "Layouts That Persist" took it from 18 to 28. The home page's Trending list changed **on the very next request**: it beat "TypeScript" (27) and entered the top 3. With only Day 3's `cacheLife('minutes')`, it could have shown the old numbers for up to a minute. Now it changes **when something happens** (a like), not when a timer runs out.
- **Comments use their own tag.** `getComments(slug)` is tagged `comments:<slug>`, and nothing else. A new comment expires only that post's comment list. The article stays cached.

**The three options:**

| You call | What the user sees | Use it when |
|---|---|---|
| `updateTag('x')` | their change, right away (the page waits for fresh data) | the person who made the change must see it: likes, comments, editing their profile |
| `revalidateTag('x', 'max')` | the **old** data once more, while fresh data loads in the background. The next visit shows it | being a bit late is fine: a CMS publish, a webhook (Day 8). Also works in Route Handlers, `updateTag` doesn't |
| `refresh()` | the page re-rendered, cache untouched | the change isn't in any cache, for example a cookie |

- **Avoid:** `revalidateTag('x')` with **one** argument. It's the old, deprecated form. Always pass `'max'`, or use `updateTag`.

## 3. `useActionState`: pending state and errors for a form

- **What it does:** connects a form to an action and gives you back **what the action returned** (for example, error messages) and **whether it's still running**.
  ```tsx
  const [state, formAction, pending] = useActionState(addCommentAction.bind(null, slug), { status: 'idle' });
  // state    → whatever the action returned last time
  // pending  → true while the POST is in flight
  <form action={formAction}>…<button disabled={pending}>{pending ? 'Posting…' : 'Post comment'}</button></form>
  ```
- **The action gets the previous state first, then the form data:**
  ```ts
  export async function addCommentAction(slug: string, prevState: CommentFormState, formData: FormData) {
    const parsed = commentSchema.safeParse({ name: formData.get('name'), body: formData.get('body') });
    if (!parsed.success) {
      return { status: 'error', fieldErrors: z.flattenError(parsed.error).fieldErrors, values: … };
    }
    await createComment(slug, parsed.data);
    updateTag(`comments:${slug}`);
    return { status: 'success', message: 'Thanks! Your comment is posted.' };
  }
  ```
  `bind(null, slug)` pre-fills the first argument, so the action knows which post the comment is for.
- **Zod** checks the input against a description of what's valid:
  ```ts
  const commentSchema = z.object({
    name: z.string().trim().min(1, 'Please enter your name.').max(40, '…'),
    body: z.string().trim().min(3, 'Write at least 3 characters.').max(500, '…'),
  });
  ```
  `safeParse` never throws. It returns `{ success: true, data }` (clean, trimmed values) or `{ success: false, error }`.
- **Always validate on the server.** `required` or `maxLength` in the HTML are nice for the user, but a hand-made POST skips them.
- **The trap we hit (measured): React empties the form after every submit**, even when there's an error. With "Luis" / "ok" typed, the error appeared and **both fields were blank**. The fix: the action returns what was typed (`values`), and the inputs use it as `defaultValue`. After a success, `values` is empty, so the form resets to blank (which is what you want).
- **Use it:** for every form whose result the user needs to see (errors, "saved!").
- **Avoid:** copying the inputs into `useState` just to keep them. `defaultValue` + the returned values is enough.

## 4. `useOptimistic`: show it now, confirm later

- **What it does:** shows a temporary value **while an action is running**. When the action finishes, the temporary value is thrown away and the real value from the server takes its place.
  ```tsx
  const [optimisticLikes, addOptimisticLike] = useOptimistic(likes, (current: number) => current + 1);

  <form action={async () => {
    addOptimisticLike(undefined); // the button shows +1 on the next frame
    await likePostAction(slug);   // the server saves it, the page re-renders with the real number
  }}>
  ```
- **Timeline of three quick clicks** (measured in dev, starting at 31):

  | Time | Button shows | Why |
  |---|---|---|
  | 30 ms | **34** | three optimistic +1s, no server answer yet |
  | while waiting | 34 | the server runs the three likes **one after another** (the terminal shows 3 × `incrementLikes`) |
  | after the last response | 34 | the optimistic value is dropped. The real count from the server is also 34, so nothing jumps |

- **If the action fails**, the optimistic value is simply dropped and the button goes back to the server's number. You write no "undo" code.
- **Use it:** for small, almost-always-successful changes where waiting feels slow: likes, toggles, adding an item to a list.
- **Avoid:** for things where failure is common or costly (payments, sign-up). Show `pending` instead.
- **The button changed:** without logins, the server can't know **who** liked, so there's no unlike anymore. Every click adds one. Day 9 adds "one like per user".

---

## Details (OK to skip for now)

- **Actions run one at a time.** The browser sends Server Actions in a queue: the second waits until the first is done. That's why 3 clicks gave 3 `incrementLikes` in a row, not in parallel. `Promise.all` over several actions doesn't make them parallel.
- **Forms without JavaScript (progressive enhancement).** When `<form action>` gets a Server Action directly (like `formAction` from `useActionState`), the HTML contains a real `method="POST"` form, so the browser can send it with JavaScript off. A form whose `action` is a **client** function (like the like button's `async () => { … }`) has nothing to send. ⚠️ Measured on 16.4.5 (homework #3): with JS off, the comment **is saved**, but the page never gets a response. See the homework review.
- **`'use server'` inside a function:** a Server Component can also define an action inline (`async function save() { 'use server'; … }`). A Client Component can only **import** actions from a `'use server'` **file**.
- **`useFormStatus`:** gives `pending` to a component **inside** the form, like a reusable `<SubmitButton>`. `useActionState`'s `pending` covers the same need here.
- **`redirect()` after a write:** `redirect` stops the function (it throws), so call `updateTag` **before** it.
- **Action IDs:** the browser only gets an encrypted ID for each action, never its code. After a new deployment the IDs change, and an old open tab gets a "Failed to find Server Action" error. A reload fixes it.
- **Size limit:** an action's request body is capped at 1 MB by default (`serverActions.bodySizeLimit` in `next.config.ts`).
- **Pending comment cards:** the Next.js docs show a pattern where a new comment appears faded at once (with `useOptimistic([])`), then turns solid when saved. It's the bonus homework.
- **The build table didn't change:** post pages are still `○`. Comments come from a cached function, so they're part of the prerendered page, and `updateTag` refreshes them.

---

## Cheat sheet

| I want… | Write… | Where |
|---|---|---|
| a function the browser can call on the server | `'use server'` at the top of the file + `export async function` | `actions.ts` |
| call it from a form | `<form action={myAction}>` | Client or Server Component |
| pass an ID along with the form | `myAction.bind(null, id)` | Client Component |
| the user sees their change immediately | `updateTag('post:<slug>')` | inside the action, after the write |
| update in the background, a bit late is fine | `revalidateTag('tag', 'max')` | action or Route Handler |
| re-render the page, cache untouched | `refresh()` from `next/cache` | inside the action |
| errors + "Saving…" for a form | `const [state, formAction, pending] = useActionState(action, initial)` | Client Component |
| check the input | `schema.safeParse(...)` with zod | first lines of the action |
| keep typed values after an error | return `values` from the action, use them as `defaultValue` | action + form |
| show the change before the server answers | `useOptimistic(serverValue, update)` | Client Component |

---

## 📝 Homework

**Write your prediction first**, then check. One or two sentences per answer is enough. If you don't know, write "I don't know, my guess is…". A guess is more useful to review than a skipped question.

1. **Too broad a tag (predict, then check in dev).** In `likePostAction`, replace the two `updateTag` lines with a single `updateTag('posts')`.
   a. Predict: after one like, you open `/posts`. Will the terminal show `[db] →` lines? Which ones?
   b. Does the like still show up on the post page and in Trending? Why?
   Check by watching the terminal, then put the two precise tags back.
2. **Late on purpose (predict, then check on a production build).** Replace `updateTag('trending')` with `revalidateTag('trending', 'max')`. Keep `updateTag('post:…')`. Build and start (`npm run build && npx next start -p 3005`), like a post 5 times, then load `/` twice. Predict, then write down: what does Trending show the **first** time, and the **second** time?
3. **Turn JavaScript off.** In Chrome DevTools: `Cmd+Shift+P` → type "Disable JavaScript". Reload a post.
   a. Post a comment. Does it work? Is it saved?
   b. Click the ♥ button. What happens, and why is it different from the comment form? (Hint: Details → progressive enhancement.)
   Turn JavaScript back on afterwards.
4. **Delete a comment (coding).** Add a "Delete" button to each comment:
   - `db.comments.delete(id)` in `src/lib/db.ts`
   - `deleteComment(slug, id)` in `src/data/comments.ts`
   - `deleteCommentAction(slug, id)` in `actions.ts`: validate both inputs with zod (the `id` should be a positive integer), then `updateTag` the right tag.

   Which tag did you choose, and why? Who can delete comments right now? (Write it down; Day 9 fixes it.)
5. *(Bonus)* Make a new comment appear **immediately**, faded, while it's being saved. Follow "Step 4: Add comments with instant feedback" in `node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md`.

---

## ✅ Homework review

| # | Your answer | Result |
|---|---|---|
| 1a | `posts.findMany` runs when you open `/posts` | 🟡 Right, plus one more: `authors.findMany` |
| 1b | Yes, both still update | ✅ Right result. The reason needs fixing, see below |
| 2 | First load 33, then 36 | ✅ Right idea: `'max'` shows the old copy once. One detail below |
| 3a | Hangs, but the comment was saved | ✅ Right, and it's not your code (measured below) |
| 3b | The like does nothing, and the count doesn't change | ✅ Right. The explanation is half right, see below |
| 4 | Delete action with `updateTag('post:<slug>')` | ❌ Wrong tag, and a hidden `await` bug. Both fixed, plus the optimistic fade you asked about |

### #1: why the like still shows

`updateTag('posts')` expires **every saved copy labeled `posts`**. Look at the labels from Day 3:

| Cached function | Labels |
|---|---|
| `getPublishedPosts` (the `/posts` list) | **`posts`** |
| `getPostBySlug` (shows likes) | **`posts`**, `post:<slug>` |
| `getTrendingPosts` (shows likes) | **`posts`**, `trending` |

The post page and Trending still update because they **also** carry the `posts` label, not because of the `findMany` query. The cost: every list that **doesn't** show likes also gets thrown away. So `/posts` runs `posts.findMany` **and** `authors.findMany` again (`getPublishedPosts` reads both at once with `Promise.all`, Day 2), for a number it doesn't even display.

### #2: one visit late

Measured on a production build (`file-based-routing` at 31, 5 likes, then load `/` three times):

| Load | Trending shows | Why |
|---|---|---|
| 1st | **31** (old) | `'max'` = serve the old copy, refresh in the background |
| 2nd | **36** | the background refresh has finished |
| 3rd | 36 | |

So `revalidateTag('x', 'max')` makes the page **one visit late**. That's fine for a CMS, but wrong for "I just liked this".

Your **33** was a background refresh that happened partway through your 5 clicks. Something read `/` after 2 likes (an earlier visit, or the header's `<Link href="/">` prefetching), which saved a copy with 33. I could **not** reproduce the "33 changes to 36 almost instantly" part: in my tests (full reload and client navigation) the page stayed old until the next load. If it happens again, tell me exactly how you opened `/`.

The like code is back to `updateTag('trending')`.

### #3a: the comment form "pauses"

Measured (a POST exactly like a browser with JavaScript off):
- The action **runs** and the comment **is saved** (the terminal shows `comments.create`).
- The response **never arrives**: 0 bytes after 20 seconds. That's the "pause" you saw.

I narrowed it down:

| Test page | JS-off POST |
|---|---|
| a plain `<form action={serverAction}>` | ✅ 200 in 54 ms |
| just `<CommentForm>` (`useActionState`), nothing else | ❌ hangs |
| the post page without `ensureStatic` | ❌ hangs |

So it's the `useActionState` + JavaScript-off combination on Next 16.4.5 with Cache Components. It's not your code, and not the cache. Real visitors have JavaScript, so DevNotes is fine. The lesson: "works without JS" is a claim you **test**, not assume.

### #3b: why the ♥ does nothing

This is the HTML the server sends (measured with `curl`), before any JavaScript runs:

```html
<!-- the like button's form -->
<form action="javascript:throw new Error('React form unexpectedly submitted.')">

<!-- the comment form -->
<form action="" method="POST" encType="multipart/form-data">
  <input type="hidden" name="$ACTION_1:0" value='{"id":"70bf6f…", "bound":"$@1"}'/>
  <input type="hidden" name="$ACTION_1:1" value='["layouts-that-persist", {"status":"idle"}]'/>
```

- **The comment form** gets a Server Action, which has a **server ID**. React can write it into the HTML as a real POST form (the action ID and the bound slug sit in hidden inputs), so the browser can send it without React.
- **The like form** gets `async () => { addOptimisticLike(); await likePostAction(slug) }`. That function exists **only in the browser's JavaScript**. There's nothing to write into HTML, so React writes a placeholder that throws. With JS off, nothing happens. (That's the `React form unexpectedly submitted` error from the Day 7 reload loop: the page reloaded before React had loaded, and someone clicked.)

So the difference isn't `useActionState` itself. It's: **is the form's action a Server Action, or a browser-only function?** `<form action={likePostAction.bind(null, slug)}>` would also work without JS, but then you lose the optimistic +1 (the `useOptimistic` call has to run in the browser).

### #4: delete

**Bug 1: the wrong tag.** The comment list is saved by `getComments`, labeled `comments:<slug>`. `post:<slug>` is the **article's** label. Measured with your version on a production build:

| | Result |
|---|---|
| 1st delete right after the server started | looked fine |
| 2nd delete | removed from the DB, but **still on the page**, even after a reload |

The first one only "worked" because the server's cache was empty after the restart, so the re-render fetched everything fresh. Once the comments were cached, `post:<slug>` didn't touch them. **Rule: the tag in `updateTag` must match the `cacheTag` of the function that reads the data you changed.**

**Bug 2: `await` that doesn't wait.**
```ts
delete: (id: string) => {
  query(`comments.delete(${id})`, …);   // ← no `return`
},
```
With `{ }` braces, an arrow function returns nothing unless you write `return`. So `await db.comments.delete(id)` awaited `undefined` and moved on immediately, while the delete still needed 500 ms. The re-render could read the comments **before** the delete finished. TypeScript didn't complain, because awaiting `undefined` is allowed. Fixed: `delete: (id: number) => query(…)`, with no braces.

**Smaller cleanup:** the id went number → string → `parseInt` → string → `parseInt`. Numbers survive the trip from the browser, so it's a `number` the whole way now. zod still checks it (`z.number().int().positive()`).

**Who can delete?** You said "anyone who can access the page". It's even wider: **anyone who can send a POST**, without ever opening the page. That's Day 9's job.

**Your question: how to make it optimistic, and should the parent own it?**
Half yes: the parent **passes the action down**, but `useOptimistic` stays in the button. It can't go in the parent, because `<Comments>` is a Server Component and hooks only work in Client Components. The pattern from the Next.js docs ("Step 7" in `guides/interactive-apps.md`):

```tsx
// comments.tsx (Server Component): bind the action here, pass it down
<li className="… has-data-pending:opacity-30">
  …
  <DeleteButton deleteAction={deleteCommentAction.bind(null, slug, comment.id)} />
</li>

// delete-button.tsx (Client Component)
const [isPending, setIsPending] = useOptimistic(false);
<form action={async () => { setIsPending(true); await deleteAction(); }}>
  <button data-pending={isPending ? '' : undefined}>{isPending ? 'Deleting…' : 'Delete'}</button>
</form>
```

- The button only knows "am I deleting?" and shows it as an HTML attribute, `data-pending`.
- The `<li>` fades itself with CSS: `has-data-pending:` means "if anything inside me has `data-pending`". No state is lifted, and no callbacks are passed around.
- When the response arrives, the comment is gone from the server's list, so the card disappears.

Measured on a production build: the card fades to about 30% and the button says "Deleting…" 100 ms after the click. After the response, the comment is gone, and it stays gone after a reload.
